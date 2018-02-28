const streamToText = require('./stream-to-text.js');
const path = require('path');
const wav = require('wav')
const EventEmitter = require('events');
const appSettings = require('./settings.js').appSettings;

/*
 * Audio parameters
 */

const bitNumber = 16

/*
    End of parameters
*/

// Audio Recorder
exports.AudioRecorder =  class AudioRecorder extends EventEmitter {

    constructor(index, suffix) {
        super();

        this.active = false;
        this.hold = false;
        this.index = index;

        this.recordingEnabled = false;
        this.workspacePath = '';
        this.suffix = suffix;

        this.buffer = undefined;
        this.writer = undefined;
        this.path = undefined;

        this.transcripter = new streamToText.Transcripter();

        this.transcripter.on('data', data => {
            this.emit('fuzzy-transcript', this.path, data);
            console.log(data);
        });

        this.transcripter.on('error', err => {
            console.error(err);
        });
    }

    receive(data) {

        if(this.active) {

            if(this.hold) {

                if(typeof(this.buffer) !== 'undefined') {

                    this.buffer = Buffer.concat([this.buffer, data]);
                }

                else {

                    this.buffer = data;
                }
            }

            else {

                try {

                    if(typeof(this.buffer) !== 'undefined') {

                        data = Buffer.concat([this.buffer, data]);
                        this.buffer = undefined;

                        console.log(`Wrote samples buffered in writer ${this.index}`);
                    }

                    if( !this.writer.write(data)) {

                        console.warn(`Write stream ${this.index} is full\nHolding samples...`);
                        this.hold = true;
                    }
                }

                catch(err) {

                    console.error(`Couldn't write to recorder ${this.index}`);
                    console.warn(err);

                    this.stopRecording();
                }

            }

            this.transcripter.putData(data);

        }
    }

    startRecording(id) {
        if(this.recordingEnabled) {
            if(typeof(this.writer) !== 'undefined') {	// Verify that previous recording is cleared

                setTimeout(() => {

                    this.startRecording(id);
                    console.log(`Recorder ${id} was defined. Retrying...`);
                }, 100);

                return;
            }

            console.log(`Recorder ${this.index} started`)
            console.log(`Recorder ${this.index} was ${this.active} active`)

            let filename = path.join(this.workspacePath, `ODAS_${id}_${new Date().toLocaleString()}_${this.suffix}.wav`)
            this.path = filename

            try {
                this.writer = new wav.FileWriter(filename,{channels:1, sampleRate:appSettings.sampleRate, bitDepth:bitNumber});
                this.emit('fuzzy-recording', filename);

                this.writer.on('drain', () => { // Release hold when write stream is cleared
                    console.log(`Writer ${this.index} is empty.\nResuming...`);
                    this.hold = false;
                });

                this.active = true;
                this.hold = false;
                this.buffer = undefined;
                this.transcripter.start();
            }

            catch(err) {
                console.error(`Failed to start recorder ${this.index}`);
                console.log(err);
                this.writer = undefined;
            }
        }
    }

    stopRecording() {

        if(this.active) {

            this.active = false;
            console.log(`Recorder ${this.index} ended`);
            this.transcripter.stop();

            console.log(`Registering header on recorder ${this.index}`);
            this.writer.end();

            this.writer.on('header',(header) => {

                console.log(`Registered header on recorder ${this.index}`);
                this.emit('add-recording', this.writer.path);

                this.writer = undefined;
                console.log(`Recorder ${this.index} undefined`);

            });
        }
    }

    enableRecording(workspacePath) {
        this.recordingEnabled = true;
        this.workspacePath = workspacePath;
    }

    disableRecording() {
        this.recordingEnabled = false;
        this.stopRecording();
    }
}
