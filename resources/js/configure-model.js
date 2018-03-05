const fs = require('fs');
const ipcRenderer = require('electron').ipcRenderer;
const dialog = require('electron').remote.dialog;

/*
 * Model for UI data
 */

const configureModel = new Vue({
    el: "#configure-form",

    data: {
        useSpeech: false,
        apiKeyfile: 'google-api-key.json',
        languageCode: 'fr-CA',
        languageCodesList: ['fr-CA', 'fr-FR', 'en-US', 'en-CA'],
        languageString: '',
        sampleRate: 16000,
        userMessage: ''
    },

    computed: {
        customLanguage: function() {
            return this.languageCode === 'other';
        },
        language: function() {
            if(this.languageCode !== 'other')
                return this.languageCode;
            else
                return this.languageString;
        },
        apiKeyfileError: function() {
            return !fs.existsSync(this.apiKeyfile);
        },
        sampleRateError: function() {
            if(this.sampleRate === "")
                return true;
            else
                return parseInt(this.sampleRate) <= 0 || this.sampleRate % 1 != 0;
        },
        languageStringError: function() {
            return !/([a-z]{2}-[A-Z]{2})/.test(this.language);
        },
        hasError: function() {
            let speechError = (this.languageStringError || this.apiKeyfileError) && this.useSpeech;
            return this.sampleRateError || speechError;
        }
    },

    methods: {
        applySettings: function(settings) {
            this.sampleRate = settings.sampleRate;
            this.apiKeyfile = settings.apiKeyfile;
            this.useSpeech = settings.useSpeech;

            if(this.languageCodesList.indexOf(settings.language) >= 0) {
                this.languageCode = settings.language;
                this.languageString = '';
            }

            else {
                this.languageCode = 'other';
                this.languageString = settings.language;
            }

            this.userMessage = 'Loaded settings.';
        }
    }
});

/*
 * Map events on buttons
 */

const saveButton = document.getElementById('save-button');
const cancelButton = document.getElementById('cancel-button');
const closeButton = document.getElementById('close-button');
const keyfileInput = document.getElementById('api-keyfile-input');

cancelButton.addEventListener('click', event => {
    window.close();
});

closeButton.addEventListener('click', event => {
    window.close();
});

saveButton.addEventListener('click', event => {

    if(configureModel.hasError) {
        configureModel.userMessage = 'You must correct errors!';
    }

    else {
        configureModel.userMessage = 'Saving settings...';
        ipcRenderer.send('set-settings', {
            language: configureModel.language,
            apiKeyfile: configureModel.apiKeyfile,
            sampleRate: configureModel.sampleRate,
            useSpeech: configureModel.useSpeech
        });
    }
});

const browseKey = function(event) {

    dialog.showOpenDialog(
        {properties: ['openFile'], title: 'Select Google Api key file'},
        function (files) {
            if(files)
                configureModel.apiKeyfile = files[0];
        }
    );
}

/*
 * Get settings from main process
 */

ipcRenderer.on('settings-applied', (event, err) => {
    console.log(err);
    console.log(event);
    if(err == null)
        configureModel.userMessage = 'Settings saved.';
    else
        configureModel.userMessage = err;
});

ipcRenderer.on('settings', (event, settings, err) => {
    if(err == null) {
        configureModel.applySettings(settings);
    }
    else
        configureModel.userMessage = err;
});

/*
 * Request current settings on window load
 */

ipcRenderer.send('get-settings');
