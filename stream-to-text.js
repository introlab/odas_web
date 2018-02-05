const EventEmitter = require('events');
const speech = require('@google-cloud/speech');

const client = new speech.SpeechClient({
    keyFilename: 'google-api-key.json'
});

const languageCode = "fr-CA";

exports.setLanguage = function(code) {
    languageCode = code;
}

const request = {
    config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 44100,
        languageCode: languageCode
    },
    interimResults: true
};

exports.Transcripter = class Transcripter extends EventEmitter {
    constructor() {
        super()
        this.stream = null;
        this.dataBuffer = Buffer.alloc(0);
    }

    start() {
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

    stop() {
        this.stream.end();
        this.stream = null;
        this.dataBuffer = Buffer.alloc(0);
    }

    putData(data) {
        this.dataBuffer = Buffer.concat([this.dataBuffer, data]);

        if(this.dataBuffer.length > 882) {
            this.stream.write(this.dataBuffer);
            this.dataBuffer = Buffer.alloc(0);
        }
    }
}
