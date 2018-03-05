const LocalStorage = require('node-localstorage').LocalStorage;
const os = require('os');
const path = require('path');
const fs = require('fs');

const odasStudioPath = path.join(os.homedir(), 'odas-studio');
const storagePath = path.join(odasStudioPath, 'config');

if(!fs.existsSync(odasStudioPath))
    fs.mkdirSync(odasStudioPath);

const localStorage = new LocalStorage(storagePath);

class AppSettings {
    constructor() {
        if(localStorage.getItem('language') == null)
            localStorage.setItem('language', 'fr-CA');

        if(localStorage.getItem('sample-rate') == null)
            localStorage.setItem('sample-rate', 16000);

        if(localStorage.getItem('api-keyfile') == null)
            localStorage.setItem('api-keyfile', 'google-api-key.json');

        if(localStorage.getItem('use-speech') == null)
            localStorage.setItem('use-speech', false);
    }

    set language(language) {
        localStorage.setItem('language', language);
    }

    get language() {
        return localStorage.getItem('language');
    }

    set sampleRate(sampleRate) {
        localStorage.setItem('sample-rate', sampleRate);
    }

    get sampleRate() {
        return parseInt(localStorage.getItem('sample-rate'));
    }

    set apiKeyfile(apiKeyfile) {
        localStorage.setItem('api-keyfile', apiKeyfile);
    }

    get apiKeyfile() {
        return localStorage.getItem('api-keyfile');
    }

    set useSpeech(useSpeech) {
        localStorage.setItem('use-speech', useSpeech);
    }

    get useSpeech() {
        return localStorage.getItem('use-speech') === 'true';
    }
}

const appSettings = new AppSettings();
exports.appSettings = appSettings;
