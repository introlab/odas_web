# ODAS Studio
A desktop user interface for the [ODAS](https://github.com/introlab/odas) library

![ODAS Studio main screen screenshot](/screenshots/main.png)

## Description
ODAS Studio is a desktop interface built to visually represents data produced by the ODAS algorithm and manage recordings of separated audio sources. ODAS Studio represents audio energy and tracked audio sources on an unit sphere and is a powerful tool when tuning ODAS settings. ODAS Studio also records separated audio as distinct wav files. ODAS Studio is built on the Electron framework and can be run natively on PC, Mac and Linux.

## Installation
### From sources
1. Install Node.js
1. Install npm
1. Clone the repository
1. Run _npm install_ in root folder

### From prebuilt package
1. Download appropriate [release](https://github.com/introlab/odas_web/releases) for your OS.
1. Extract to the desired location.

## Usage
* Run _npm start_ in root folder to laumch the app from sources.
* Run the executable in the extracted release folder to launch the prebuilt app.

### Configure ODAS
The ODAS library must be built to use ODAS Studio. ODAS Studio can be run either with a local or remote ODAS core. For local execution, it is suggested to use 127.0.0.1 as the computer IP. The _Local System Monitor_ in ODAS Studio displays the computer IP for easy configuration of a remote system.

ODAS Studio uses TCP sockets to receive data from ODAS, thus, it is important to specify the following sinks in the ODAS configuration file:
* **SSL**
```
potential: {
  format = "json";
  interface: {
    type = "socket";
    ip = "<IP>";
    port = 9001;
  };
};
```
* **SST**
```
tracked: {
  format = "json";
  interface: {
    type = "socket";
    ip = "<IP>";
    port = 9000;
  };
};
```
* **SSS**
```
separated: {
  fS = <SAMPLE RATE>;
  hopSize = 512;
  nBits = 16;        

  interface: {
    type = "socket";
    ip = "<IP>";
    port = 10000;
  }        
};

postfiltered: {
  fS = <SAMPLE RATE>;
  hopSize = 512;
  nBits = 16;        

  interface: {
    type = "socket";
    ip = "<IP>";
    port = 10001;
  }        
};
```

### Run ODAS
For local execution, browse the odascore binary and the configuration file in the _ODAS Control_ pane. A local ODAS execution can then be controlled using the green _Launch ODAS_ button.

For remote execution, start ODAS in command line on the distant system. As odascore is a TCP client and ODAS Studio is a TCP server, ODAS Studio must be started before odascore.

### Live Data
This is the main page of ODAS Studio.

![ODAS Studio Live Data page screenshot](/screenshots/live_data.png)

* **Local System Monitor** : displays performance information about the computer running ODAS Studio.
* **ODAS Control** : is used to start and stop ODAS in local mode or indicate when a remote odascore is connected.
* **Source Elevation** : sound source elevation relative to the X-Y pane in decimal degree.
* **Source Azimut** : sound source azimut around the Z axis relative to the X axis in decimal degree.
* **Active Sources Locations** : sound source elevation and azimut on the unit sphere.
* **Sources** : selects which tracked source is displayed. Useful to hide a parasitic source in the environment.
* **Filters** : sets visibility of tracked sources and sound energy. The _energy range_ slider adjust the energy levels that are displayed in the interface.

### Record
Click the record button at the upper right of the Live Data window to open the Record window.

![ODAS Studio Record page screenshot](/screenshots/record.png)

* **Workspace Path** : specifies a folder where audio files will be recorded. It must be set before enabling recording.
* **Show** : chooses to dispay either separated, postfiltered or all recordings.
* **Record** : when selected, separated audio sources will be recorded in distinct wav files.
* The file list displays recordings in the workspace and allows playback and deletion of files.
* The transcript displays the speech to text transcription of the hovered recording.

### Configure
Click the configure button at the upper right of the Live Data window to open the Configure window.

![ODAS Studio Configure page screenshot](/screenshots/configure.png)

* **Use Google Speech Voice Recognition** : sends recorded audio to Google Speech service to generate transcriptions.
* **Google API Keyfile** : path to your Google Speech API json key.
* **Transcription Language** : language in which the recorded audio is processed by Google.
* **Sample Rate** : sample rate of the audio streams produced by ODAS. Must match ODAS sink config file.

## License
ODAS Studio is free and open source. ODAS Studio is licensed under the [MIT License](/LICENSE).
