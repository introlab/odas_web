const electron = require('electron');
const AudioRecorder = require('./audio-recorder.js');

const ipcRenderer = electron.ipcRenderer;

const recorder = new AudioRecorder();
