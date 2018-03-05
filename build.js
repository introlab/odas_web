const packager = require('electron-packager');
const rebuild = require('electron-rebuild').rebuild;

packager({
    dir: '.',
    ignore: 'google-api-key.json',
    afterCopy: [
        (buildPath, electronVersion, platform, arch, callback) => {
            rebuild({ buildPath, electronVersion, arch })
            .then(() => callback())
            .catch((error) => callback(error));
        }
    ],
    arch: ['ia32','x64','armv7l'],
    executableName: 'odasStudio',
    icon: 'resources/images/introlab_icon',
    name: 'ODAS Studio',
    out: 'build',
    overwrite: 'true',
    platform: 'linux, win32, darwin'
})

.catch(err => console.error(err));
