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

                ipcRenderer.send('new-recording',newMap[src.id],src.id)
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

        ipcRenderer.send('end-recording',index)
    });

    // Trigger update
    document.dispatchEvent(new Event('tracking'));

    // Send to main
    ipcRenderer.send('tracking', currentFrame.sources);
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
    ipcRenderer.send('tracking', currentFrame.sources);
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
