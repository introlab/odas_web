var canvas, camera, controls, scene, renderer, potGroup, sourceGroup;
var subCanvas, subCamera, subScene, subRenderer;
var labelX, labelY, labelZ;

var sources3D = [];
var sources3DTrail = [];

var potSources3D = [];

const camOffset = 2.1;

init();
animate();

/*
 * Draw sources and sphere
 */

function init() {

    // Canvas
    canvas = document.getElementById("sphere");

    canvas.style.height = '100%';
    canvas.style.width = '100%';

    // Renderer
    renderer = new THREE.WebGLRenderer( { antialias: true, canvas: canvas });
    renderer.setClearColor( 0xffffff );
    renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);

    // Cameras
    camera = new THREE.PerspectiveCamera( 70, canvas.offsetWidth/canvas.offsetHeight , 1, 4 );
    camera.position.y = -camOffset;
    camera.up.set(0,0,1);

    // Cameras controls
    controls = new THREE.TrackballControls( camera,canvas );
    controls.rotateSpeed = 5;
    controls.noZoom = true;
    controls.noPan = true;

    controls.dynamicDampingFactor = 0.2;

    // Scene
    scene = new THREE.Scene();

    // Sphere

    // Top
    var sphereGeometry = new THREE.SphereGeometry( 1, 10, 10,0,Math.PI,0,Math.PI);
    var sphereMaterial = new THREE.MeshBasicMaterial({ color:0x0000ff, transparent: true, opacity:0.25});

    var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    //scene.add(sphere);

    var sphereMaterial = new THREE.MeshBasicMaterial({ color:0x0000ff, transparent: true, opacity:0.25, wireframe:true});

    var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    scene.add(sphere);

    // Bottom
    var sphereGeometry = new THREE.SphereGeometry( 1, 10, 10,Math.PI,Math.PI,0,Math.PI);
    var sphereMaterial = new THREE.MeshBasicMaterial({ color:0x8d4f1a, transparent: true, opacity:0.5});

    var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    //scene.add(sphere);

    var sphereMaterial = new THREE.MeshBasicMaterial({ color:0x8d4f1a, transparent: true, opacity:0.5, wireframe:true});

    var sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
    scene.add(sphere);

    // Ground
    var groundGeometry = new THREE.CircleGeometry(1,10);
    var groundMaterial = new THREE.MeshBasicMaterial({ color:0x328327, transparent: true, opacity:0.5});
    groundMaterial.side = THREE.DoubleSide;

    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    scene.add(ground);

    // Cube
    var cubeGeometry = new THREE.BoxGeometry(0.5,0.5,0.1);
    var cubeMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe:false});

    var cube = new THREE.Mesh(cubeGeometry,cubeMaterial);

    scene.add(cube);

    // Sources
    sourceGroup = new THREE.Group();

    var sourceGeometry = new THREE.SphereGeometry( 0.08, 10, 10);

    rgbValueStrings.forEach(function(color) {

        var sourceMaterial = new THREE.MeshBasicMaterial( {color: color, wireframe:false} );
        var source = new THREE.Mesh( sourceGeometry, sourceMaterial );
        source.visible = false;

        sources3D.push(source);
        sourceGroup.add(source);
    });

    scene.add( sourceGroup );

    // Potential sources
    potGroup = new THREE.Group();
    scene.add(potGroup);

    /*
     * Draw sub canvas with axis
     */

    // Canvas
    subCanvas = document.getElementById("axis");

    // Renderer
    subRenderer = new THREE.WebGLRenderer( { antialias: true, canvas: subCanvas });
    subRenderer.setClearColor(0xffffff);
    subRenderer.setSize(80,80);

    // Scene
    subScene = new THREE.Scene();

    // Camera
    subCamera = new THREE.PerspectiveCamera(90,1,0.1,5);
    subCamera.position.z = 3.5;
    subCamera.up = camera.up;

    // Axis
    var axis = new THREE.AxisHelper(1.2);
    scene.add( axis );

    var subAxis = new THREE.AxisHelper(1.2);
    subScene.add( subAxis );

    // Add axes labels
    var loader = new THREE.FontLoader();
    loader.load( './../resources/fonts/helvetiker_regular.typeface.json', function ( helFont ) {

        var  textGeo = new THREE.TextGeometry('X', {
             size: 0.3,
             height: 0.001,
             curveSegments: 6,
             font: helFont,
             style: "normal"
        });

        var  textMaterial = new THREE.MeshBasicMaterial({ color: "rgb(255,0,0)" });
        labelX = new THREE.Mesh(textGeo , textMaterial);

        labelX.position.x = 1.2;
        labelX.position.y = 0.01;
        labelX.position.z = 0;
        subScene.add(labelX);

        var  textGeo = new THREE.TextGeometry('Y', {
             size: 0.3,
             height: 0.001,
             curveSegments: 6,
             font: helFont,
             style: "normal"
        });

        var  textMaterial = new THREE.MeshBasicMaterial({ color: "rgb(0,255,0)" });
        labelY = new THREE.Mesh(textGeo , textMaterial);

        labelY.position.x = 0.03;
        labelY.position.y = 1.2;
        labelY.position.z = 0;
        subScene.add(labelY);

        var  textGeo = new THREE.TextGeometry('Z', {
             size: 0.3,
             height: 0.001,
             curveSegments: 6,
             font: helFont,
             style: "normal"
        });

        var  textMaterial = new THREE.MeshBasicMaterial({ color: "rgb(0,0,255)" });
        labelZ = new THREE.Mesh(textGeo , textMaterial);

        labelZ.position.x = 0.01;
        labelZ.position.y = 0.01;
        labelZ.position.z = 1.2;
        subScene.add(labelZ);

    } );

    window.addEventListener( 'resize', onWindowResize, false );
}

/*
 * Resize canvas and renderer when page is resized
 */
function onWindowResize() {

    camera.aspect = canvas.offsetWidth/canvas.offsetHeight ;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.offsetWidth,canvas.offsetHeight);

    canvas.style.height = '100%';
    canvas.style.width = '100%';
}

/*
 * Render a frame
 */

function animate() {

    requestAnimationFrame( animate );

    if(controls.enabled)
        controls.update();

    try {
        subCamera.rotation.copy(camera.rotation);
        subCamera.position.copy(camera.position);

        labelX.rotation.copy(camera.rotation);
        labelY.rotation.copy(camera.rotation);
        labelZ.rotation.copy(camera.rotation);
    }

    catch(err) {
        // Scene not loaded
    }

    finally {
        render();
    }
}

function render() {

    renderer.render( scene, camera );
    subRenderer.render( subScene, subCamera);

}

/*
 * Draw source on sphere when tracking data is received
 */

// Material for tails
var sourceMaterial = [];

rgbValueStrings.forEach(function(color) {
   sourceMaterial.push(new THREE.PointsMaterial({
       color: color,
       size: 0.05
   }));
});

// Update on new event
document.addEventListener('tracking', function(e) {

    // Clear older trail pixels
    if(sources3DTrail.length > 0) {

        sources3DTrail.forEach(function(src,i) {
            src.life--;

            if(src.life < 1) {  // Dispose of pixel if life is over

                src.obj.material.dispose();
                src.obj.geometry.dispose();
                src.obj.parent.remove(src.obj);
                src.obj = null;
                sources3DTrail.splice(i,1);
            }
        })
    }

    // Update source on sphere
    currentFrame.sources.forEach(function(source,index) {

        sources3D[index].visible = filterManager.showSources && source.active && source.selected && !(source.x == 0 && source.y == 0 && source.z == 0);

        sources3D[index].position.x = source.x;
        sources3D[index].position.y = source.y;
        sources3D[index].position.z = source.z;

        // Add a pixel to the tail if the source is visible
        if( sources3D[index].visible ) {

            var geo = new THREE.Geometry();
            var ps = new THREE.Vector3(source.x,source.y,source.z);
            geo.vertices.push(ps);

            var sys = new THREE.Points(geo,sourceMaterial[index]);
            sources3DTrail.push({obj:sys,life:150});
            sourceGroup.add(sys);
        }
    });
});

// Update visibility when selection is changed
document.addEventListener('update-selection',function(e){

    currentFrame.sources.forEach(function(source,index) {
        sources3D[index].visible =  filterManager.showSources && source.active && source.selected && !(source.x == 0 && source.y == 0 && source.z == 0);
    });
});

/*
 * Draw potential sources on sphere when potential source data is received
 */

// Material from heatmap gradiant color
var potSourceMaterial = [];

heatmapColors.forEach(function(color) {
   potSourceMaterial.push(new THREE.PointsMaterial({
       color: color,
       size: 0.1
   }));
});

// Update on 'potential' event
document.addEventListener('potential', function(e) {

    // Remove old trail points
    if(potSources3D.length > 0) {

        potSources3D.forEach(function(src,i) {
            src.life--;

            if(src.life < 1) {  // Dispose if life is over
                src.obj.material.dispose();
                src.obj.geometry.dispose();
                src.obj.parent.remove(src.obj);
                src.obj = null;
                potSources3D.splice(i,1);
            }
        })
    }

    // Add potential source to sphere if potential source filter is selected
    if(currentFrame.potentialSources.length > 0 && filterManager.showPotentials) {

        currentFrame.potentialSources.forEach(function(s) {

			if ( energyIsInRange(s.e) ) {    // Add source if source's energy's in range
		        var geo = new THREE.Geometry();
		        var ps = new THREE.Vector3(s.x,s.y,s.z);
		        geo.vertices.push(ps);

		        var sys = new THREE.Points(geo,potSourceMaterial[scaleEnergy(s.e)]);
		        potSources3D.push({obj:sys,life:50});
		        potGroup.add(sys);
			}
        });

    }
});

/*
 * Clear sphere when no data is reveived
 */

document.addEventListener('clearChart',function(e) {

    if(potSources3D.length > 0) {

        potSources3D.forEach(function(src,i) {
                src.obj.material.dispose();
                src.obj.geometry.dispose();
                src.obj.parent.remove(src.obj);
        });
    }

    potSources3D = [];

    if(sources3DTrail.length > 0) {

        sources3DTrail.forEach(function(src,i) {
                src.obj.material.dispose();
                src.obj.geometry.dispose();
                src.obj.parent.remove(src.obj);
        });
    }

    sources3DTrail = [];
});


/*
 * Ortho view switch
 */

var viewFront = function() {

    camera.up.set(0,0,1);

    camera.position.x = 0;
    camera.position.y = -camOffset;
    camera.position.z = 0;

    controls.reset();
};
