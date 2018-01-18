const electron = require('electron')

// Module to control application life.
const app = electron.app
app.commandLine.appendSwitch('--ignore-gpu-blacklist');

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1200, height: 800,
    'web-preferences': {
              'web-security': false,
              "webgl": true
          }})


  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'views/live_data.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
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
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

/*
 * Create TCP server for source tracking
 */

// Load modules
const StringDecoder = require('string_decoder').StringDecoder;
var net = require('net');

var server = net.createServer();
server.on('connection', handleConnection);

server.listen(9000, function() {
  console.log('server listening to %j', server.address());
});

function handleConnection(conn) {
  var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
  console.log('new client connection from %s', remoteAddress);

  conn.on('data', onConnData);
  conn.once('close', onConnClose);
  conn.on('error', onConnError);

  function onConnData(d) {

    var decoder = new StringDecoder();

    // Decode received string
    var str = decoder.write(d);

    try {
      mainWindow.webContents.send('newTracking',str);
      if(typeof odas_process == 'undefined') {
        mainWindow.webContents.send('remote-online');
      }
    }

    catch(err) {
      console.log('Window was closed');
    }

  }

  function onConnClose() {
    console.log('connection from %s closed', remoteAddress);
    mainWindow.webContents.send('remote-offline');
  }

  function onConnError(err) {
    console.log('Connection %s error: %s', remoteAddress, err.message);
  }
}


/*
 * Create TCP server for potential sources
 */

var potentialServer = net.createServer();
potentialServer.on('connection', handlePotConnection);

potentialServer.listen(9001, function() {
  console.log('server listening to %j', potentialServer.address());
});

function handlePotConnection(conn) {
  var remoteAddress = conn.remoteAddress + ':' + conn.remotePort;
  console.log('new client connection from %s', remoteAddress);

  conn.on('data', onConnData);
  conn.once('close', onConnClose);
  conn.on('error', onConnError);

  function onConnData(d) {

    var decoder = new StringDecoder();

    // Decode received string
    var str = decoder.write(d);

    try {
      mainWindow.webContents.send('newPotential',str);
      if(typeof odas_process == 'undefined') {
        mainWindow.webContents.send('remote-online', conn.remoteAddress);
      }
    }

    catch(err) {

      console.log('Window was closed');
    }

  }

  function onConnClose() {
    console.log('connection from %s closed', remoteAddress);
    mainWindow.webContents.send('remote-offline');
  }

  function onConnError(err) {
    console.log('Connection %s error: %s', remoteAddress, err.message);
  }
}


/*
 * ODAS Control
 */

const ipcMain = electron.ipcMain
const child_process = require('child_process')

let odas_process

ipcMain.on('launch-odas', function(event, core, config) {

  console.log('received launch command')
  console.log(core)
  console.log(config)

  odas_process = child_process.spawn(core, ['-c', config])

  event.sender.send('launched-odas', true)
})


ipcMain.on('stop-odas', function(event) {

  odas_process.kill('SIGINT')
  odas_process = undefined

  console.log('received stop command')
})
