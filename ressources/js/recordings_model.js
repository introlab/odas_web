const ipcRenderer = require('electron').ipcRenderer
const path = require('path')
const os = require('os')
const fs = require('fs')
const info = require('wav-file-info')
const dialog = require('electron').remote.dialog

// Single recording class
class Recording {

  constructor(filename) {

    // Init audio recording
    this.isPlaying = false
    this.timestamp = new Date()
    this.filename = filename
    this.path = path.join(os.homedir(), 'Music', this.filename)
    this.duration = 0
    this.audio = undefined

    // Read duration from wave file
    info.infoByFilename(this.path, (err, info) => {
      if(err == null) {

        this.duration = info.duration
        this.timestamp = new Date(info.stats.birthtime)
      }

      else {
        this.duration = -1
      }
    })
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
    workspacePath: localStorage.workspacePath,
    recordingEnabled: false
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
        RecordingsModel.recordings.push(new Recording(file))
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

ipcRenderer.on('new-recording', (event, filename) => {

  RecordingsModel.recordings.push(new Recording(filename))
})

// Close window and stop recording
const quit = function() {
  ipcRenderer.send('stop-recording')
  window.close()
}

// Initialise list after page has loaded

if(typeof(RecordingsModel.workspacePath) != 'undefined')
  createList(RecordingsModel.workspacePath)
