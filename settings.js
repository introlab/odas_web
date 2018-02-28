const LocalStorage = require('node-localstorage').LocalStorage;

const localStorage = new LocalStorage('./config');

class AppSettings {
    constructor() {
        if(localStorage.getItem('language') == null)
            localStorage.setItem('language', 'fr-CA');

        if(localStorage.getItem('sample-rate') == null)
            localStorage.setItem('sample-rate', 16000);

        if(localStorage.getItem('api-keyfile') == null)
            localStorage.setItem('api-keyfile', 'google-api-key.json');
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
        return localStorage.getItem('sample-rate');
    }

    set apiKeyfile(apiKeyfile) {
        localStorage.setItem('api-keyfile', apiKeyfile);
    }

    get apiKeyfile() {
        return localStorage.getItem('api-keyfile');
    }
}

const appSettings = new AppSettings();
exports.appSettings = appSettings;
