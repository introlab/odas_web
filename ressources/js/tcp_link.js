/*
 * Web Socket connection to server
 */

// Generate websocket server URL
var loc = window.location, new_uri, sys_uri, pot_uri;

if (loc.protocol === "https:") {
    new_uri = "wss:";
} else {
    new_uri = "ws:";
}

audio_uri = new_uri + "//" + loc.host + "/audio";
sys_uri = new_uri + "//" + loc.host + "/system.info";
pot_uri = new_uri + "//" + loc.host + "/potential";
new_uri += "//" + loc.host + "/tracking";

/*
 * Tracking data socket
 */

// Open socket and create parser
var socket = new WebSocket(new_uri);
console.log(new_uri);

// Update current data with received data
var indexMap = {};

socket.onmessage = function(msg) {
        
    try { 
        var strData = msg.data;
        var data = JSON.parse(strData);
    }

    catch(err) {

        // Can't parse frame
        console.error(err);
        console.log(strData);
        return;
    }
    
    if(Math.abs(data.frame.timestamp -  currentFrame.timestamp) > 1)
        console.warn('Frame skipped ' + data.frame.timestamp.toString());

    currentFrame.timestamp = data.frame.timestamp;

    var newMap = {};
    var indexPool = [];
    rgbValueStrings.forEach(function(c,index) {
        indexPool.push(index);
    });
    var hasNewSource = false;
    
    if(data.frame.src) {    // If frame contains sources
        
        data.frame.src.forEach(function(src) {  // Remove still used index from the pool
            
            if(typeof(indexMap[src.id])!='undefined') {  // If source is not new
                indexPool.splice(indexPool.indexOf(indexMap[src.id]),1);
                //console.log(indexPool);
            }
        });
        
        data.frame.src.forEach(function(src) { // Update sources

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

/*
 * Potential sources socket
 */

var potentialSocket = new WebSocket(pot_uri);
console.log(pot_uri);


// Update current data with received potential sources
potentialSocket.onmessage = function(msg) {
        
    try { 
        var strData = msg.data;
        var data = JSON.parse(strData);
    }

    catch(err) {

        // Can't parse frame
        console.error(err);
        console.log(strData);
        return;
    }
    
    if(Math.abs(data.frame.timestamp -  currentFrame.ptimestamp) > 1)
        console.warn('Frame skipped ' + data.frame.timestamp.toString());

    currentFrame.ptimestamp = data.frame.timestamp;
    currentFrame.potentialSources = [];
    
    if(data.frame.src) {    // If frame contains sources
        
        data.frame.src.forEach(function(source) {
            
            var newSource = new PotentialSource();
            
            newSource.e = source.e;
            newSource.x = source.x;
            newSource.y = source.y;
            newSource.z = source.z;
            
            currentFrame.potentialSources.push(newSource);
            
        });
        
    }

    // Trigger update
    document.dispatchEvent(new Event('potential'));

};

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
 * System info socket
 */

var systemSocket = new WebSocket(sys_uri);

systemSocket.onmessage = function(msg) {
    
    var data = JSON.parse(msg.data);
    
    systemMonitor.system.cpu = data.cpu.toPrecision(3).toString() + ' %';
    systemMonitor.system.mem = data.mem.toPrecision(2).toString() + ' %';
    systemMonitor.system.temp = data.temp.toPrecision(3).toString() + ' °C';
};

/*
 * Audio socket
 */

var audioSocket = new WebSocket(audio_uri);

audioSocket.onmessage = function(msg) {
    
     var reader = new FileReader();
    
    reader.onloadend = function() {
        document.dispatchEvent(new CustomEvent('audioData', { 'detail': reader.result}));
    };

    reader.readAsArrayBuffer(msg.data);  
};