// Load modules
const StringDecoder = require('string_decoder').StringDecoder;
var net = require('net');

let trackingServer
let potentialServer

/*
 * Create TCP server for source tracking
 */

 let remainingTrack = '';

 exports.startTrackingServer = (odasStudio) => {

   trackingServer = net.createServer();
   trackingServer.on('connection', handleConnection);

   trackingServer.listen(9000, function() {
     console.log('server listening to %j', trackingServer.address());
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
       var stream = remainingTrack + decoder.write(d);
       strs = stream.split("}\n{");
       if(strs.length < 2) {
           remainingTrack = stream;
           return;
       }

       strs.forEach((str,index) => {

           if(index == strs.length-1) {
               remainingTrack = str;
               return;
           }

           if(str.charAt(0) !== '{') {
               str = '{' + str;
           }

           if(str.charAt(str.length-2) !== '}') {
               if(str.charAt(str.length-3)!== '}') {
                   str = str + '}';
               }
           }

           try {
             odasStudio.mainWindow.webContents.send('newTracking',str);
             if(typeof odasStudio.odas.odas_process == 'undefined') {
               odasStudio.mainWindow.webContents.send('remote-online');
             }
           }

           catch(err) {
             console.log('Window was closed');
           }
       });
     }

     function onConnClose() {
       console.log('connection from %s closed', remoteAddress);
       odasStudio.mainWindow.webContents.send('remote-offline');
     }

     function onConnError(err) {
       console.log('Connection %s error: %s', remoteAddress, err.message);
     }
   }

 }


/*
 * Create TCP server for potential sources
 */

 let remainingPot = '';

 exports.startPotentialServer = (odasStudio) => {

   potentialServer = net.createServer();
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
       var stream = remainingPot + decoder.write(d);
       strs = stream.split("}\n{");
       if(strs.length < 2) {
           remainingPot = stream;
           return;
       }

       strs.forEach((str,index) => {

           if(index == strs.length-1) {
               remainingPot = str;
               return;
           }

           try {

               if(str.charAt(0) !== '{') {
                   str = '{' + str;
               }

               if(str.charAt(str.length-2) !== '}') {
                   if(str.charAt(str.length-3)!== '}') {
                       str = str + '}';
                   }
               }
             odasStudio.mainWindow.webContents.send('newPotential',str);
             if(typeof odasStudio.odas.odas_process == 'undefined') {
               odasStudio.mainWindow.webContents.send('remote-online');
             }
           }

           catch(err) {
             console.log('Window was closed');
           }
       });

     }

     function onConnClose() {
       console.log('connection from %s closed', remoteAddress);
       odasStudio.mainWindow.webContents.send('remote-offline');
     }

     function onConnError(err) {
       console.log('Connection %s error: %s', remoteAddress, err.message);
     }
   }
 }
