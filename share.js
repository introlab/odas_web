const electron = require('electron');
const fs = require('fs');
const path = require('path');
const url = require('url');

const BrowserWindow = electron.BrowserWindow;
const ipcMain = electron.ipcMain;

let shareWindow = null;

ipcMain.on('open-share-window', openShareWindow);

function openShareWindow () {

    if(shareWindow !== null) {
        shareWindow.show();
        return;
    }

    shareWindow = new BrowserWindow({width: 1280, height: 820, show: false});

    shareWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'views','share.html'),
        protocol: 'file:',
        slashes: true
    }));

    shareWindow.once('ready-to-show', function () {
        shareWindow.show()
    });

    shareWindow.on('closed', function () {
        shareWindow = null
    });
}

ipcMain.on('tracking', (event, data) => {
    if(shareWindow !== null && data.length > 0) {
        try {
            shareWindow.webContents.send('tracking', data);
        }

        catch(err) {
            console.log('Window was closed');
        }
    }
});
