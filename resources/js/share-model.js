const electron = require('electron');
const ipcRenderer = require('electron').ipcRenderer;
const pointToImage = require("../resources/js/point-to-image.js");

const markers = document.getElementsByClassName('marker');
var rgbValueStrings = ["rgb(75,192,192)","rgb(192,75,192)","rgb(192,192,30)","rgb(0,200,40)"];
/*
var errorCallback = function(e) {
    console.log('Reeeejected!', e);
  };

  // Not showing vendor prefixes.
  navigator.getUserMedia({video: { width: {min:1920}, height:{min:1080}}, audio: false}, function(localMediaStream) {
    var video = document.getElementById('video-frame')
    video.src = window.URL.createObjectURL(localMediaStream);
  }, errorCallback);
*/

ipcRenderer.on('tracking', (event, data)=> {

    data.forEach(source => {
        let marker = markers[source.index];

        if(source.active) {
            let point = {
                x: source.x,
                y: source.y,
                z: source.z
            };

            let video = document.getElementById('video-frame');

            let scale = video.offsetWidth / 640;
            let coord = pointToImage.transform(point,scale);

            marker.style.top = coord.y-25 + 'px';
            marker.style.left = coord.x-25 + 'px';

            if(coord.y < 0 || coord.x < 0) {
                marker.style.display = 'none';
            }

            else if(coord.x > 640*scale || coord.y > 480*scale) {
                marker.style.display = 'none';
            }

            else {
                marker.style.display = 'block';
            }
        }

        else {
            marker.style.display = 'none';
        }
    })
}) ;


const shareModel = new Vue({
    el: '#share-model',
    data: {
    },
    methods: {
    }
});

const drawCircle = function(canvas, index) {
    console.log(canvas);
    console.log(index);

    let centerX = 25;
    let centerY = 25;
    let radius = 20;

    let context = canvas.getContext('2d');

    context.beginPath();
    context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    context.lineWidth = 10;
    context.strokeStyle = rgbValueStrings[index];
    context.stroke();
}

for(let n = 0; n < markers.length; n++)
    drawCircle(markers[n], n);
