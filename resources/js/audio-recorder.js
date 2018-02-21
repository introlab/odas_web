const streamToText = require('./stream-to-text.js');
const electron = require('electron');
const path = require('path');
const wav = require('wav')

const ipcRenderer = electron.ipcRenderer;
const ipcMain = electron.remote.ipcMain;

// Audio Recorder
exports.AudioRecorder =  class AudioRecorder {

    constructor() {

        this.active = false;
        this.hold = false;
        this.index = window.minWidth;

        this.recordingEnabled = false;
        this.workspacePath = '';

        this.buffer = undefined;
        this.writer = undefined;
        this.path = undefined;

        this.transcripter = new streamToText.Transcripter();

        this.transcripter.on('data', data => {
            console.log(data);
            ipcRenderer.send('fuzzy-transcript', this.path, data);
        });

        this.transcripter.on('error', err => {
            console.error(err);
        });

        ipcMain.on('new-recording', (event, index, id) => {
            if(index == this.index && this.recordingEnabled) {
                this.startRecording(id);
            }
        });

        ipcMain.on('end-recording', (event, index) => {
            if(index == this.index) {
                this.stopRecording();
            }
        });

        ipcMain.on('stop-recording', (event) => {
            this.stopRecording();
        });

        ipcMain.on('start-recording', (event, workspace) => {
            this.recordingEnabled = true;
            this.workspacePath = workspace;
        });

        ipcMain.on('stop-recording', (event) => {
            this.stopRecording();
        });

        ipcRenderer.on('stop-recording', (event) => {
            this.stopRecording();
        });

        ipcRenderer.on('terminate-recording', (event) => {
            this.stopRecording(true);
        });

        ipcRenderer.on('audio-data', (event, data) => {
            this.receive(data);
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

        if(typeof(this.writer) !== 'undefined') {	// Verify that previous recording is cleared

            setTimeout(() => {

                this.startRecording(id);
                console.log(`Recorder ${id} was defined. Retrying...`);
            }, 100);

            return;
        }

        console.log(`Recorder ${this.index} started`)
        console.log(`Recorder ${this.index} was ${this.active} active`)

        let filename = path.join(this.workspacePath, `ODAS_${id}_${new Date().toLocaleString()}.wav`)
        this.path = filename

        try {
            this.writer = new wav.FileWriter(filename,{channels:1, sampleRate:sampleRate, bitDepth:bitNumber});
            ipcRenderer.send('fuzzy-recording', filename);

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

    stopRecording(terminate) {

        if(this.active) {

            this.active = false;
            console.log(`Recorder ${this.index} ended`);
            this.transcripter.stop();

            console.log(`Registering header on recorder ${this.index}`);
            this.writer.end();

            this.writer.on('header',(header) => {

                console.log(`Registered header on recorder ${this.index}`);
                ipcRenderer.send('add-recording', this.writer.path);

                this.writer = undefined;
                console.log(`Recorder ${this.index} undefined`);

            });
        }

        if(terminate)
                window.close();
    }
}
