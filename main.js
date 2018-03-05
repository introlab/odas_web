const electron = require('electron')

// Module to control application life.
const app = electron.app
app.commandLine.appendSwitch('--ignore-gpu-blacklist');   // Allows Web GL on Ubuntu

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let odasStudio = {}

function createWindow () {
  // Create the browser window.
  odasStudio.mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    'web-preferences': {
              'web-security': false,
              "webgl": true
    },
    icon: path.join(__dirname, 'resources/images/introlab_icon.png'),
    show: false
  })


  // and load the index.html of the app.
  odasStudio.mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'views/live_data.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  odasStudio.mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    odasStudio.mainWindow = null
    record.quit()
    app.quit()
  })

  odasStudio.mainWindow.on('ready-to-show', function() {
    odasStudio.mainWindow.show()
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (odasStudio.mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const sockets = require('./servers.js')
const record = require('./record.js')
const share = require('./share.js')
const configure = require('./configure.js')
odasStudio.odas = require('./odas.js')

sockets.startTrackingServer(odasStudio)
sockets.startPotentialServer(odasStudio)
