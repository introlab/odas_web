/*
 * Web Socket connection to server
 */

 const ipcRenderer = require('electron').ipcRenderer

/*
 * Tracking data socket
 */

// Update current data with received data
var indexMap = {};

const processTracking = function(event, msg) {

    try {
        var data = JSON.parse(msg);
    }

    catch(err) {

        // Can't parse frame
        console.error(err);
        console.log(msg);
        return;
    }

    if(Math.abs(data.timeStamp -  currentFrame.timestamp) > 1)
        console.warn('Frame skipped ' + data.timeStamp.toString());

    currentFrame.timestamp = data.timeStamp;

    var newMap = {};
    var indexPool = [];
    rgbValueStrings.forEach(function(c,index) {
        indexPool.push(index);
    });
    var hasNewSource = false;

    data.src = data.src.filter(function(s) {
        return s.id !== 0;
    });

    if(data.src) {    // If frame contains sources

        data.src.forEach(function(src) {  // Remove still used index from the pool

            if(typeof(indexMap[src.id])!='undefined') {  // If source is not new
                indexPool.splice(indexPool.indexOf(indexMap[src.id]),1);
                //console.log(indexPool);
            }
        });

        data.src.forEach(function(src) { // Update sources

             if(typeof(indexMap[src.id])!='undefined') {  // Source is already registered

                newMap[src.id] = indexMap[src.id];
            }

            else {  // Source is new

                newMap[src.id] = indexPool.shift(); // Get unused index from pool
                console.log('insert into map ', newMap[src.id].toString() + ' ' + src.id.toString());

                currentFrame.sources[newMap[src.id]].id = src.id;
                hasNewSource = true;
            }

            currentFrame.sources[newMap[src.id]].x = src.x;
            currentFrame.sources[newMap[src.id]].y = src.y;
            currentFrame.sources[newMap[src.id]].z = src.z;

            currentFrame.sources[newMap[src.id]].active = !(src.x==0 && src.y==0 && src.z==0);

        });

    }

    indexMap = newMap;

    indexPool.forEach(function(index) { // Clear unused source slot

        currentFrame.sources[index].id = null;

        currentFrame.sources[index].x = null;
        currentFrame.sources[index].y = null;
        currentFrame.sources[index].z = null;

        currentFrame.sources[index].active = false;
        currentFrame.sources[index].selected = true;
    });

    // Trigger update
    document.dispatchEvent(new Event('tracking'));

    if(hasNewSource)
        document.dispatchEvent(new Event('update-selection'));
};

ipcRenderer.on('newTracking', processTracking)

/*
 * Potential sources socket
 */


// Update current data with received potential sources
const processPotential = function(event, msg) {

    try {
        var data = JSON.parse(msg);
    }

    catch(err) {

        // Can't parse frame
        console.error(err);
        console.log(msg);
        return;
    }

    if(Math.abs(data.timeStamp -  currentFrame.ptimestamp) > 1)
        console.warn('Frame skipped ' + data.timeStamp.toString());

    currentFrame.ptimestamp = data.timeStamp;
    currentFrame.potentialSources = [];

    if(data.src) {    // If frame contains sources

        data.src.forEach(function(source) {

            var newSource = new PotentialSource();

            newSource.e = source.E;
            newSource.x = source.x;
            newSource.y = source.y;
            newSource.z = source.z;

            currentFrame.potentialSources.push(newSource);

        });

    }

    // Trigger update
    document.dispatchEvent(new Event('potential'));

};

ipcRenderer.on('newPotential', processPotential)

/*
 * Frame reset when no data is received
 */

document.addEventListener('clearChart', function(e){

    currentFrame.timestamp = 0;
    currentFrame.ptimestamp = 0;

    currentFrame.sources.forEach(function(source){
        source.id = null;

        source.x = null;
        source.y = null;
        source.z = null;

        source.active = false;
        source.selected = true;
    });

    currentFrame.potentialSources = [];

    document.dispatchEvent(new Event('tracking'));
    document.dispatchEvent(new Event('potential'));
    document.dispatchEvent(new Event('update-selection'));

    sourceManager.showPotentials = true;
    document.dispatchEvent(new Event('potential-visibility'));

    viewFront();

    var req = setInterval(function() {

        document.dispatchEvent(new Event('request-chart'));

        hasPotential = false;
        clearInterval(req);
        console.log('UI cleaned');

    },500);
});

/*
 * Audio socket
 */


const processAudio = function(msg) {

     var reader = new FileReader();

    reader.onloadend = function() {
        document.dispatchEvent(new CustomEvent('audioData', { 'detail': reader.result}));
    };

    reader.readAsArrayBuffer(msg.data);
};


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
