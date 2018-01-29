const electron = require('electron')
const path = require('path')
const url = require('url')

const BrowserWindow = electron.BrowserWindow
const ipcMain = electron.ipcMain

let odasStudio

exports.register = (_odasStudio) => {

  odasStudio = _odasStudio
  ipcMain.on('open-recordings-window', createWindow)
}


function createWindow () {
  odasStudio.recordingsWindow = new BrowserWindow({width: 1200, height: 800,
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
    odasStudio.recordingsWindow = null
  })
}
