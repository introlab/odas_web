const fs = require('fs');
const speech = require('@google-cloud/speech');
const appSettings = require('./../../settings.js').appSettings;

const readFile = function(filepath) {

    return new Promise((resolve, reject) => {

        fs.readFile(filepath, (err, data) => {
            if(err) reject(err);
            else resolve(data);
        });
    })
}

const processData = function(data) {

    const client = new speech.SpeechClient({
        keyFilename: appSettings.apiKeyfile
    });

    const config = {
        languageCode: appSettings.language
    };

    const audio = {
        content: data.toString('base64')
    };

    const request = {
        config: config,
        audio: audio
    };

    return client.recognize(request)
    .then(data => {

        const response = data[0];
        const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');

        return transcription;
    })
}

exports.processFile = function(filepath) {
    if(appSettings.useSpeech) {
        return readFile(filepath).then(content => processData(content));
    }
    else
        return Promise.resolve('');
}
