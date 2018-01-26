/*
 * ODAS Control
 */

exports.odas_process

const electron = require('electron')
const ipcMain = electron.ipcMain
const child_process = require('child_process')

ipcMain.on('launch-odas', function(event, core, config) {

  console.log('received launch command')
  console.log(core)
  console.log(config)

  exports.odas_process = child_process.spawn(core, ['-c', config])

  event.sender.send('launched-odas', true)
})


ipcMain.on('stop-odas', function(event) {

  exports.odas_process.kill('SIGINT')
  exports.odas_process = undefined

  console.log('received stop command')
})
