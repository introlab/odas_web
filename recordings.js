const electron = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')
const net = require('net')
const wav = require('wav')
const streamToText = require('./stream-to-text.js')

/*  Some hardcoded parameters for now
    Should be dynamic...
*/
const bitNumber = 16
const nChannels = 4
const sampleRate = 44100
/*
    End of parameters
*/

const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain

let odasStudio
let workspacePath
let record = false

exports.register = (_odasStudio) => {

  odasStudio = _odasStudio
  ipcMain.on('open-recordings-window', createWindow)
}


function createWindow () {

  if(odasStudio.recordingsWindow != null) {
    odasStudio.recordingsWindow.show()
    return
  }

  odasStudio.recordingsWindow = new BrowserWindow({width: 900, height: 700,
    'web-preferences': {
              'web-security': false,
              "webgl": true
          },
        show:false})

  odasStudio.recordingsWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'views/recordings.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Emitted when the window is closed.
  odasStudio.recordingsWindow.on('closed', function () {
    audioRecorders.forEach((recorder)=>{recorder.stopRecording()})
    odasStudio.recordingsWindow = null
  })

  odasStudio.recordingsWindow.on('ready-to-show', function() {
    odasStudio.recordingsWindow.show()
  })
}

// Receive recording control
ipcMain.on('start-recording', (event, workspace) => {
  workspacePath = workspace
  record = true
})

ipcMain.on('stop-recording', (event) => {
  record = false
  workspacePath = undefined
})

// Audio Recorder
class AudioRecorder {

  constructor(index) {

    this.index = index
    this.active = false
		this.hold = false
		this.buffer = undefined
    this.writer = undefined
    this.path = undefined

    this.transcripter = new streamToText.Transcripter()
    this.transcripter.on('data', data => {
        console.log(data)
        odasStudio.recordingsWindow.webContents.send('fuzzy-transcript', this.path, data)
    })
    this.transcripter.on('error', err => {
        console.error(err)
    })

    ipcMain.on('new-recording', (event, index, id) => {
      if(index == this.index) {
        this.startRecording(id)
      }
    })

    ipcMain.on('end-recording', (event, index) => {
      if(index == this.index) {
        this.stopRecording()
      }
    })

    ipcMain.on('stop-recording', (event) => {
      this.stopRecording()
    })
  }

  receive(data) {

    if(this.active) {
			
			if(this.hold) {
				
				if(typeof(this.buffer) !== 'undefined') {
					
					this.buffer = Buffer.concat([this.buffer, data])
				}
				
				else {
					
					this.buffer = data
				}
			}
			
			else {
				
				try {
					
					if(typeof(this.buffer) !== 'undefined') {
						data = Buffer.concat([this.buffer, data])
						this.buffer = undefined
						
						console.log(`Wrote samples buffered in writer ${this.index}`)
					}
				
					if( !this.writer.write(data)) {

						//let error = new Error(`Write stream ${this.index} is full`)
						//throw error
						console.warn(`Write stream ${this.index} is full\nHolding samples...`)
						this.hold = true
					}
				}

				catch(err) {
						console.error(`Couldn't write to recorder ${this.index}`)
						console.warn(err)

						this.stopRecording()
				}
				
			}
			
			this.transcripter.putData(data)
    }
  }

  startRecording(id) {

    if(record) {
			
			if(typeof(this.writer) !== 'undefined') {	// Verify that previous recording is cleared
				setTimeout(() => {
					this.startRecording(id)
					console.log(`Recorder ${id} was defined. Retrying...`)
				}, 100)
				
				return
			}

      console.log(`Recorder ${this.index} started`)
			console.log(`Recorder ${this.index} was ${this.active} active`)

      let filename = path.join(workspacePath, `ODAS_${id}_${new Date().toLocaleString()}.wav`)
      this.path = filename
			
			try {
				this.writer = new wav.FileWriter(filename,{channels:1, sampleRate:sampleRate, bitDepth:bitNumber})
      	odasStudio.recordingsWindow.webContents.send('fuzzy-recording', filename)
				
				this.writer.on('drain', () => {
					console.log(`Writer ${this.index} is empty.\nResuming...`)
					this.hold = false
				})

				this.active = true
				this.hold = false
				this.buffer = undefined
				this.transcripter.start()
			}
			
      catch(err) {
				console.error(`Failed to start recorder ${this.index}`)
				console.log(err);
				
				this.writer = undefined
			}
    }
  }

  stopRecording() {
    //console.log('recorder stopped')

    if(this.active) {

			this.active = false;
			console.log(`Recorder ${this.index} ended`)
      this.transcripter.stop()
			
			console.log(`Registering header on recorder ${this.index}`)
			this.writer.end()
			
      this.writer.on('header',(header) => {
				
				console.log(`Registered header on recorder ${this.index}`)
				
        if(typeof(odasStudio.recordingsWindow)!='undefined') {
          odasStudio.recordingsWindow.webContents.send('add-recording', this.writer.path)
        }
						
				this.writer = undefined
				console.log(`Recorder ${this.index} undefined`)

		  
      })
    }
  }
}

const audioRecorders = []
for(i=0; i<nChannels; i++) {
  audioRecorders.push(new AudioRecorder(i))
}

// TCP socket
class AudioSocket {

  constructor() {

    this.port = 10000
    this.server = net.createServer()

    this.server.on('connection', (conn) => {

      var remoteAddress = conn.remoteAddress + ':' + conn.remotePort
      console.log('new client connection from %s', remoteAddress)

      console.log(this)
      conn.on('data', (data) => {

        let offset = 0
        let jump = bitNumber/8
        let delta = jump-1

        if(record) {

          try {

            while(offset < data.length) {

              audioRecorders.forEach((recorder, index) => {

                recorder.receive(new Buffer.from(data.slice(offset + index*jump, offset + index*jump + delta +1)))
              })

              offset += (bitNumber / 8)*nChannels
            }

          } catch(e) {
            console.log(e)
          }
        }

      })

      conn.once('close', () => {
        console.log('connection from %s closed', remoteAddress)
        audioRecorders.forEach((recorder) => { recorder.stopRecording() })
      })

      conn.on('error', (err) => {
        console.log('Connection %s error: %s', remoteAddress, err.message)
      })
    })

    this.server.listen(this.port, () => {
      console.log('server listening to %j', this.server.address())
    })
  }

}

const audioServer = new AudioSocket()
