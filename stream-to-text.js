const EventEmitter = require('events');
const speech = require('@google-cloud/speech');
const appSettings = require('./settings.js').appSettings;

exports.Transcripter = class Transcripter extends EventEmitter {
    constructor() {
        super()
        this.stream = null;
        this.dataBuffer = Buffer.alloc(0);
    }

    start() {
        if(appSettings.useSpeech) {

            const client = new speech.SpeechClient({
                keyFilename: appSettings.apiKeyfile
            });

            const request = {
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: appSettings.sampleRate,
                    languageCode: appSettings.language
                },
                interimResults: true
            };

            this.stream = client.streamingRecognize(request)
            .on('error', (err) => {
                this.emit('error', err);
            })
            .on('data', (data) => {
                if(data.error)
                    this.emit('error', data.error);
                else if(data.results)
                    this.emit('data', data.results);
            });
        }
    }

    stop() {
        if(this.stream != null) {
            this.stream.end();
            this.stream = null;
            this.dataBuffer = Buffer.alloc(0);
        }
    }

    putData(data) {
        if(this.stream != null) {
            this.dataBuffer = Buffer.concat([this.dataBuffer, data]);

            if(this.dataBuffer.length > (appSettings.sampleRate / 10)) {
                this.stream.write(this.dataBuffer);
                this.dataBuffer = Buffer.alloc(0);
            }
        }
    }
}
