const fs = require('fs');
const speech = require('@google-cloud/speech');

const client = new speech.SpeechClient({
    keyFilename: 'google-api-key.json'
});

const languageCode = "fr-CA";

exports.setLanguage = function(code) {
    languageCode = code;
}

const readFile = function(filepath) {

    return new Promise((resolve, reject) => {

        fs.readFile(filepath, (err, data) => {
            if(err) reject(err);
            else resolve(data);
        });
    })
}

const processData = function(data) {

    const config = {
        languageCode: languageCode
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

    return readFile(filepath)
    .then(content => processData(content))
}
