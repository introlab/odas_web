/*
 * ODAS Launcher
 */

const dialog = require('electron').remote.dialog

const core_path_field = document.getElementById('odas-core-path')
const config_path_field = document.getElementById('odas-config-path')
const launch_btn = document.getElementById('odas-btn')

const odas_local_well = document.getElementById('odas-local')
const odas_remote_well = document.getElementById('odas-remote')

let odas_core_path
let odas_config_path

if(localStorage.odas_core_path) {
  odas_core_path = localStorage.odas_core_path
  core_path_field.value = odas_core_path
}

if(localStorage.odas_config_path) {
  odas_config_path = localStorage.odas_config_path
  config_path_field.value = odas_config_path
}


core_path_field.addEventListener('click', function() {

  dialog.showOpenDialog(
    { properties: ['openFile'], title: 'Browse ODAS Core executable'},
      function (files) {

        if(files) {
          let path = files[0]
          odas_core_path = path
          core_path_field.value = odas_core_path
          localStorage.odas_core_path = odas_core_path
        }
      })
})


config_path_field.addEventListener('click', function() {

  dialog.showOpenDialog(
    { properties: ['openFile'], title: 'Browse ODAS config file'},
      function (files) {

        if(files) {
          let path = files[0]
          odas_config_path = path
          config_path_field.value = odas_config_path
          localStorage.odas_config_path = odas_config_path
        }
      })
})


const launchOdas = function() {

  if(typeof odas_core_path == 'undefined') {

    dialog.showMessageBox({
      type:'info',
      buttons:['OK'],
      title:'Error',
      message:'Core path not set.',
      detail:'Please set ODAS Core path before launching ODAS.'
    })

    return
  }


  if(typeof odas_config_path == 'undefined') {

    dialog.showMessageBox({
      type:'info',
      buttons:['OK'],
      title:'Error',
      message:'Config file path not set.',
      detail:'Please set ODAS configuration file path before launching ODAS.'
    })

    return
  }

  ipcRenderer.send('launch-odas', odas_core_path, odas_config_path)
  launch_btn.removeEventListener('click', launchOdas)
  launch_btn.innerHTML = 'Launching...'
}


const stopOdas = function() {

  ipcRenderer.send('stop-odas')

  launch_btn.innerHTML = 'Launch ODAS'
  launch_btn.removeEventListener('click', stopOdas)
  launch_btn.addEventListener('click', launchOdas)

  setTimeout(function() {document.dispatchEvent(new Event('clearChart'));}, 1000)
}

launch_btn.addEventListener('click', launchOdas)


ipcRenderer.on('launched-odas', function(sender, ok) {

  if(ok) {
    launch_btn.innerHTML = 'Stop ODAS'
    launch_btn.addEventListener('click', stopOdas)
  }
})

ipcRenderer.on('remote-online', function(ip) {
  odas_remote_well.style.display = 'block'
  odas_local_well.style.display = 'none'

})

ipcRenderer.on('remote-offline', function() {
  odas_remote_well.style.display = 'none'
  odas_local_well.style.display = 'block'
  setTimeout(function() {document.dispatchEvent(new Event('clearChart'));}, 1000)
})

odas_remote_well.style.display = 'none'
