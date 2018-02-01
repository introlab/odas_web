const ipcRenderer = require('electron').ipcRenderer;
const path = require('path');
const os = require('os');
const fs = require('fs');
const info = require('wav-file-info');
const dialog = require('electron').remote.dialog;
const speechToText = require('./../resources/js/speech-to-text.js');

// Fuzzy recording class
class FuzzyRecording {
  constructor(fullPath) {

    this.filename = path.basename(fullPath)
    this.path = fullPath
    this.timestamp = new Date()
  }
}

// Single recording class
class Recording {

  constructor(fullPath) {

    // Init audio recording
    this.isPlaying = false
    this.timestamp = new Date()
    this.path = fullPath
    this.filename = path.basename(this.path)
    this.duration = 0
    this.audio = undefined
    this.deleting = 'hidden'
    this.transcription = 'Not available'

    this.readInfo(true)
    this.createTranscript();

  }

  readInfo(retry) {
    // Read duration from wave file
    info.infoByFilename(this.path, (err, info) => {
      if(err == null) {

        this.duration = info.duration
        this.timestamp = new Date(info.stats.birthtime)

        RecordingsModel.recordings.sort((a,b) => {
          if(a.timestamp < b.timestamp)
            return 1

          else if(a.timestamp > b.timestamp)
            return -1

          else {
            return 0
          }
        })
      }

      else {
        this.duration = -1
        console.log(err)
        if(retry) {
          setTimeout(() => { this.readInfo(false)}, 3000)
        }
      }
    })
  }

  createTranscript() {

      const txtPath = this.path.slice(0, -4)+'.txt';

      fs.readFile(txtPath, 'utf-8', (err, data) => {
          if(err) {
              console.log('Getting transcript of ' + this.path);
              this.transcription = 'Processing...'
              speechToText.processFile(this.path)
              .then(transcription => {
                  this.transcription = transcription;
                  fs.writeFile(txtPath, transcription, (err) => {
                      if(err) console.log(err);
                  })
              })
              .catch(err => {
                  console.log(err);
                  this.transcription = "Couldn't process";
              });
          }

          else {
              this.transcription = data;
          }
      });
  }

  play() {
    this.isPlaying = true

    this.audio = new Audio(this.path)

    this.audio.onended = () => {

      this.isPlaying = false
      this.audio = undefined
    }

    this.audio.play()
  }

  stop() {
    this.isPlaying = false

    if(typeof(this.audio) != 'undefined') {

      this.audio.pause()
      this.audio = undefined
    }
  }

}

// Recording model
const RecordingsModel = new Vue({
  el: '#recordings-table',
  data: {
    recordings: [],
    fuzzyRecordings: [],
    workspacePath: localStorage.workspacePath,
    recordingEnabled: false,
    hovering: null,
  },
  computed: {
      transcription: function() {
          if(this.hovering) return this.hovering.transcription;
          else return '';
      }
  },
  methods: {
    removeRecording(filepath) {

      console.log(`Deleting ${filepath}`)
      fs.unlinkSync(filepath)
      fs.unlinkSync(filepath.slice(0, -4)+'.txt')

      this.recordings = this.recordings.filter((rec) => {return rec.path !== filepath})
    }
  }
})

// Changing Workspace
const changeWorkspace = function() {
  console.log("Changing workspace...")

  dialog.showOpenDialog(
    { properties: ['openDirectory'], title: 'Chooser workspace folder'},
      function (files) {

        if(files) {

          let path = files[0]
          RecordingsModel.workspacePath = path
          localStorage.workspacePath = path
          createList(path)

          ipcRenderer.send('stop-recording')
          ipcRenderer.send('start-recording', path)
        }
  })
}

// Create file list
const createList = function(workspace) {

  RecordingsModel.recordings = []

  fs.readdir(workspace, (err, files) => {
    files.forEach(file => {

      console.log(file)
      if(path.extname(file).toLowerCase() === '.wav')
        RecordingsModel.recordings.push(new Recording(path.join(RecordingsModel.workspacePath,file)))
    })
  })
}

// Control recording
const recordControl = function() {
  if(RecordingsModel.recordingEnabled) {
    if(typeof(RecordingsModel.workspacePath)!='undefined') {
      ipcRenderer.send('start-recording', RecordingsModel.workspacePath)
      console.log('Start recording at ' + RecordingsModel.workspacePath)
    }

    else {
      alert('You must set workspace path to enable recording!')
      RecordingsModel.recordingEnabled = false
    }
  }

  else {
    ipcRenderer.send('stop-recording')
    console.log('Stop recording')
  }
}

ipcRenderer.on('add-recording', (event, filename) => {

  RecordingsModel.recordings.unshift(new Recording(filename))
  RecordingsModel.fuzzyRecordings = RecordingsModel.fuzzyRecordings.filter((recording) => {
    return recording.path !== filename
  })
})

ipcRenderer.on('fuzzy-recording', (event, filename) => {

  RecordingsModel.fuzzyRecordings.unshift(new FuzzyRecording(filename))
})

// Close window and stop recording
const quit = function() {
  ipcRenderer.send('stop-recording')
  window.close()
}

// Initialise list after page has loaded

if(typeof(RecordingsModel.workspacePath) != 'undefined')
  createList(RecordingsModel.workspacePath)
