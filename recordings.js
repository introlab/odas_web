const electron = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')
const net = require('net')
const wav = require('wav')

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
  odasStudio.recordingsWindow = new BrowserWindow({width: 900, height: 700,
    'web-preferences': {
              'web-security': false,
              "webgl": true
          }})

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
    this.writer = undefined

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

    if(typeof(this.writer)!=='undefined') {
      this.writer.write(data)
    }
  }

  startRecording(id) {
    console.log('recorder started')

    if(typeof(this.writer) == 'undefined' && record) {

      let filename = path.join(workspacePath, `ODAS_${id}_${new Date().toLocaleString()}.wav`)
      this.writer = new wav.FileWriter(filename,{channels:1, sampleRate:sampleRate, bitDepth:bitNumber})
    }
  }

  stopRecording() {
    //console.log('recorder stopped')

    if(typeof(this.writer) !== 'undefined') {

      this.writer.end()
      this.writer.on('header',(header) => {
        if(typeof(odasStudio.recordingsWindow)!='undefined') {
          odasStudio.recordingsWindow.webContents.send('add-recording', this.writer.path)
        }

        this.writer = undefined
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
                //recorder.receive(new Buffer.from([data[offset+index*jump],data[offset+index*jump+delta]]))
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
