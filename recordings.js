const electron = require('electron')
const fs = require('fs')
const path = require('path')
const url = require('url')
const net = require('net')

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

let audioRecorders = [];
const recorderUrl = url.format({
    pathname: path.join(__dirname, 'views', 'audio-recorder.html'),
    protocol: 'file',
    slashes: true
});

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
    audioRecorders.forEach((recorder)=>{recorder.webContents.send('terminate-recording')})
    odasStudio.recordingsWindow = null
  })

  odasStudio.recordingsWindow.on('ready-to-show', function() {
    odasStudio.recordingsWindow.show()
  })

  audioRecorders = [];
  for(i=0; i<nChannels; i++) {

        let recorder = new BrowserWindow({width: 150, height: 150, minWidth: i, show: true});
        recorder.loadURL(recorderUrl);
        audioRecorders.push(recorder);
        console.log(recorder);
  }
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


				try {

					while(offset < data.length) {

						audioRecorders.forEach((recorder, index) => {

							recorder.webContents.send('audio-data', receive(new Buffer.from(data.slice(offset + index*jump, offset + index*jump + delta +1))));
						})

						offset += (bitNumber / 8)*nChannels
					}

				} catch(e) {
					console.log(e)
				}

      })

      conn.once('close', () => {
        console.log('connection from %s closed', remoteAddress)
        audioRecorders.forEach((recorder) => { recorder.webContents.send('stop-recording'); });
      })

      conn.on('error', (err) => {
        console.log('Connection %s error: %s', remoteAddress, err.message)
        audioRecorders.forEach((recorder) => { recorder.webContents.send('stop-recording'); });
      })
    })

    this.server.listen(this.port, () => {
      console.log('server listening to %j', this.server.address())
    })
  }

}

const audioServer = new AudioSocket()
