const electron = require('electron');
const path = require('path');
const url = require('url');
const appSettings = require('./settings.js').appSettings;

const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

/*
 * Manage configuration window
 */

let configureWindow = null;

function openConfigureWindow () {

    if(configureWindow !== null) {
        configureWindow.show();
        return;
    }

    configureWindow = new BrowserWindow({width: 800, height: 600, show: false});

    configureWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views','configure.html'),
        protocol: 'file:',
        slashes: true
    }));

    configureWindow.once('ready-to-show', function () {
        configureWindow.show();
    });

    configureWindow.on('closed', function () {
        configureWindow = null;
    });
}

ipcMain.on('open-configure-window', openConfigureWindow);

/*
 * Access the app settings
 */

const getSettings = function() {

    let settings = {
        language: appSettings.language,
        sampleRate: appSettings.sampleRate,
        apiKeyfile: appSettings.apiKeyfile,
        useSpeech: appSettings.useSpeech
    };

    return settings;
}

const setSettings = function(settings) {

    if(settings.useSpeech) {
        appSettings.language = settings.language;
        appSettings.sampleRate = settings.sampleRate;
        appSettings.apiKeyfile = settings.apiKeyfile;
        appSettings.useSpeech = settings.useSpeech;
    }

    else {
        appSettings.sampleRate = settings.sampleRate;
        appSettings.useSpeech = settings.useSpeech;
    }
}

/*
 * Respond to settings window requests
 */

ipcMain.on('get-settings', event => {
    let settings = getSettings();
    event.sender.send('settings', settings);
});

ipcMain.on('set-settings', (event, settings) => {
    setSettings(settings);
    event.sender.send('settings-applied');
});
