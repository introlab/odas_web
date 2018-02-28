const fs = require('fs')
const path = require('path')
const url = require('url')
const net = require('net')
const AudioRecorder = require('./audio-recorder.js').AudioRecorder

/*
 * Audio parameters
 */

const bitNumber = 16
const nChannels = 4

/*
 * Parse arguments
 */
const portNumber = parseInt(process.argv[2]);
const suffix = process.argv[3];

/*
 * Construct audio recorders
 */

const audioRecorders = [];

for(i=0; i<nChannels; i++) {
    let recorder = new AudioRecorder(i, suffix);

    // Relay messages from recorder to main process
    recorder.on('fuzzy-transcript', (filename, data) => {
        process.send({event:'fuzzy-transcript', filename:filename, data:data});
    });

    recorder.on('fuzzy-recording', filename => {
        process.send({event:'fuzzy-recording', filename:filename});
    });

    recorder.on('add-recording', filename => {
        process.send({event:'add-recording', filename:filename});
    })

    audioRecorders.push(recorder);
}

/*
 * Construct audio socket server
 */

class AudioSocket {

  constructor() {

    this.port = portNumber;
    this.connected = false;
    this.server = net.createServer()

    this.server.on('connection', (conn) => {

      var remoteAddress = conn.remoteAddress + ':' + conn.remotePort
      console.log('new client connection from %s', remoteAddress)
      this.connected = true;

      conn.on('data', (data) => {

        let offset = 0
        let jump = bitNumber/8
        let delta = jump-1


				try {

					while(offset < data.length) {

						audioRecorders.forEach((recorder, index) => {

							recorder.receive(new Buffer.from(data.slice(offset + index*jump, offset + index*jump + delta +1)));
						})

						offset += (bitNumber / 8)*nChannels
					}

				} catch(e) {
					console.log(e)
				}

      })

      conn.once('close', () => {
        console.log('connection from %s closed', remoteAddress)
        this.connected = false;
        audioRecorders.forEach((recorder) => {
            recorder.stopRecording();
        });
      })

      conn.on('error', (err) => {
        console.log('Connection %s error: %s', remoteAddress, err.message)
        this.connected = false;
        audioRecorders.forEach((recorder) => {
            recorder.stopRecording();
        });
      })
    })

    this.server.listen(this.port, () => {
      console.log('server listening to %j', this.server.address())
    })
  }

}

const audioServer = new AudioSocket()

/*
 * Control recorder according to commands received
 */

process.on('message', m => {
    switch(m.event) {
        case 'new-recording':
            audioRecorders[m.index].startRecording(m.id);
            break;

        case 'end-recording':
            audioRecorders[m.index].stopRecording();
            break;

        case 'start-recording':
            audioRecorders.forEach(recorder => {
                recorder.enableRecording(m.workspace);
            });
            break;

        case 'stop-recording':
            audioRecorders.forEach(recorder => {
                recorder.disableRecording();
            });
            break;

        default:
            console.warn(`Unhandled main process message ${m}`);
            break;
    }
});
