const electron = require('electron')

const BrowserWindow = electron.remote.BrowserWindow

const path = require('path')
const url = require('url')

let legalWindow

function openLegalWindow () {
  // Create the browser window.
  legalWindow = new BrowserWindow({width: 800, height: 600, show: false})


  // and load the index.html of the app.
  legalWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'legal.html'),
    protocol: 'file:',
    slashes: true
  }))

  legalWindow.once('ready-to-show', function () {

    legalWindow.show()
  })

  // Emitted when the window is closed.
  legalWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    legalWindow = null
  })
}
