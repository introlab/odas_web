const electron = require('electron');
const fork = require('child_process').fork;
const spawn = require('child_process').spawn;
const path = require('path')
const url = require('url')

const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

/*
 * Start the recording process
 */

const separatedProcess = spawn(process.execPath, ['./recordings.js', 10000, 'sp'], {stdio: [0, 1, 2, 'ipc']});
const postfilteredProcess = spawn(process.execPath, ['./recordings.js', 10010, 'pf'], {stdio: [0, 1, 2, 'ipc']});

exports.quit = function quit() {
    separatedProcess.kill();
    postfilteredProcess.kill();
}

/*
 * Manage the recordings window
 */

let recordingsWindow;

function createWindow () {

    if(recordingsWindow != null) {
        recordingsWindow.show();
    }

    else {
        recordingsWindow = new BrowserWindow({
            width: 900, height: 700,
            'web-preferences': {
                'web-security': false,
                "webgl": true
            },
            show:false
        });

        recordingsWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'views/recordings.html'),
            protocol: 'file:',
            slashes: true
        }));

        // Emitted when the window is closed.
        recordingsWindow.on('closed', function () {
            if(separatedProcess.connected)
                separatedProcess.send({event:'stop-recording'});
            recordingsWindow = null;
        });

        recordingsWindow.on('ready-to-show', function() {
            recordingsWindow.show()
        });
    }
}

ipcMain.on('open-recordings-window', createWindow);

/*
 * Pass commands between main process and recording process
 */

// Receive from live and record window

ipcMain.on('new-recording', (event, index, id) => {
    if(separatedProcess.connected)
        separatedProcess.send({event:'new-recording', index:index, id:id});

    if(postfilteredProcess.connected)
        postfilteredProcess.send({event:'new-recording', index:index, id:id});
});

ipcMain.on('end-recording', (event, index) => {
    if(separatedProcess.connected)
        separatedProcess.send({event:'end-recording', index:index});

    if(postfilteredProcess.connected)
        postfilteredProcess.send({event:'end-recording', index:index});
});

ipcMain.on('start-recording', (event, workspace) => {
    if(separatedProcess.connected)
        separatedProcess.send({event:'start-recording', workspace:workspace});

    if(postfilteredProcess.connected)
        postfilteredProcess.send({event:'start-recording', workspace:workspace});
});

ipcMain.on('stop-recording', (event) => {
    if(separatedProcess.connected)
        separatedProcess.send({event:'stop-recording'});

    if(postfilteredProcess.connected)
        postfilteredProcess.send({event:'stop-recording'});
});

// Receive from record process

separatedProcess.on('message', m => {
    if(recordingsWindow != null) {
        switch(m.event) {
            case 'fuzzy-transcript':
                recordingsWindow.webContents.send('fuzzy-transcript', m.filename, m.data);
                break;

            case 'fuzzy-recording':
                recordingsWindow.webContents.send('fuzzy-recording', m.filename);
                break;

            case 'add-recording':
                recordingsWindow.webContents.send('add-recording', m.filename);
                break;

            default:
                console.warn(`Unhandled recording process message ${m}`);
                break;
        }
    }
});

postfilteredProcess.on('message', m => {
    if(recordingsWindow != null) {
        switch(m.event) {
            case 'fuzzy-transcript':
                recordingsWindow.webContents.send('fuzzy-transcript', m.filename, m.data);
                break;

            case 'fuzzy-recording':
                recordingsWindow.webContents.send('fuzzy-recording', m.filename);
                break;

            case 'add-recording':
                recordingsWindow.webContents.send('add-recording', m.filename);
                break;

            default:
                console.warn(`Unhandled recording process message ${m}`);
                break;
        }
    }
});
