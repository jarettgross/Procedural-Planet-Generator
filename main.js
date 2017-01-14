//==================
//INITIALIZE
//==================

init();

var type = "NORMAL";
var planetSize = 200;
var tessellation = 150;
var minHeight = 1.0;
var maxHeight = 1.5;
var seed = Math.random();
var lacunarity = 1.5;
var persistance = 0.5;
var octaves = 2;

//For use without web worker
//initNoise(Math.random());
//createScene(type, planetSize, tessellation, minHeight, maxHeight);

//For use with web worker
beginWorker(type, planetSize, tessellation, minHeight, maxHeight, seed, lacunarity, persistance, octaves);

//==================
//SCENE CREATION
//==================

//WITHOUT WEB WORKER
function createScene(type = "TILE-FLAT-HEIGHT", planetSize = 200, tessellation = 4, minHeight = 1.0, maxHeight = 1.5) {

    //Type, Size, Tessellation, MinHeight, MaxHeight
    //Types: NORMAL, TILE-FLAT, TILE-HEIGHT, TILE-FLAT-HEIGHT
    var geometry = generatePlanet(type, planetSize, tessellation, minHeight, maxHeight);

    planet = new THREE.Mesh(geometry, pickMaterial());

    scene.add(planet);
}

//WITH WEB WORKER
function beginWorker(type = "TILE-FLAT-HEIGHT", planetSize = 200, tessellation = 4, minHeight = 1.0, maxHeight = 1.5, 
                     seed = Math.random(), lacunarity = 1.9, persistance = 0.5, octaves = 5) {

    var worker = new Worker("generatePlanet.js");
    
    NProgress.start();

    //Type options: NORMAL, TILE-NORMAL, TILE-HEIGHT, TILE-FLAT-HEIGHT
    worker.postMessage({
        type:         type,
        planetSize:   planetSize,
        tessellation: tessellation,
        minHeight:    minHeight,
        maxHeight:    maxHeight,
        seed:         seed,
        lacunarity:   lacunarity,
        persistance:  persistance,
        octaves:      octaves
    });

    worker.onmessage = function(e) {

        if (e.data.ready) {
            var geometry = e.data.geometry;

            //Need to make new geometry due to web worker issues with Three geometry
            var g = new THREE.Geometry();
            g.vertices = geometry.vertices;
            g.faces = geometry.faces;

            planet = new THREE.Mesh(g, pickMaterial("PHONG", 0.1, THREE.FlatShading));
            scene.add(planet);

            worker.terminate();

            NProgress.done();
        } else {
            NProgress.inc(1/30);
        }
    };
}

//=============================
//GRAPHICS FUNCTIONS & CONTROLS
//=============================

var camera, scene, renderer, controls, planet;

function init() {
    //SCENE
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    //CAMERA
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
    camera.position.z = 800;

    //LIGHTS
    // ambientLight = new THREE.AmbientLight(0xffffff);
    // scene.add(ambientLight);

    var pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(80, 50, 500);
    scene.add(pointLight);

    //RENDERER
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    render();

    //CONTROLS
    initControls();
}

function render() {
    requestAnimationFrame(render);

    if (isLeft)  planet.rotation.y -= 0.015;
    if (isRight) planet.rotation.y += 0.015;
    if (isUp)    planet.rotation.x -= 0.015;
    if (isDown)  planet.rotation.x += 0.015;

    if (isPlus) {
        camera.fov -= 0.25;
        camera.updateProjectionMatrix();
    }
    if (isMinus) {
        camera.fov += 0.25;
        camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
}

//Set up controls for rotating planet
var isLeft, isUp, isRight, isDown;
function initControls() {
    //Keyboard controls
    window.onkeydown = function(e) {
        if (e.keyCode === 37) {
            isLeft = true;
        } else if (e.keyCode === 38) {
            isUp = true;
        } else if (e.keyCode === 39) {
            isRight = true;
        } else if (e.keyCode === 40) {
            isDown = true;
        } else if (e.keyCode === 61) {
            isPlus =  true;
        } else if (e.keyCode === 173) {
            isMinus = true;
        }
    }

    window.onkeyup = function(e) {
        if (e.keyCode === 37) {
            isLeft = false;
        } else if (e.keyCode === 38) {
            isUp = false;
        } else if (e.keyCode === 39) {
            isRight = false;
        } else if (e.keyCode === 40) {
            isDown = false;
        } else if (e.keyCode === 61) {
            isPlus =  false;
        } else if (e.keyCode === 173) {
            isMinus = false;
        }
    }

    //Mouse controls
    //controls = new THREE.OrbitControls(camera, renderer.domElement);
}

function clearScene() {
    scene.remove(planet);
}

//==================
//HELPER FUNCTIONS
//==================

//Initialize noise parameters - seed, lacunarity, persistance, octaves
var lacunarity, persistance, octaves;

function initNoise(seed, l = 1.9, p = 0.5, o = 5) {
    noise.seed(seed);
    lacunarity = l;
    persistance = p;
    octaves = o;
}

//Set the material of the planet mesh
function pickMaterial(type = "PHONG", shininess = 0, shading = THREE.FlatShading) {
    if (type === "PHONG") {
        var material = new THREE.MeshPhongMaterial({
            shininess:    shininess,
            side:         THREE.FrontSide,
            shading:      shading,
            vertexColors: THREE.VertexColors,
        });
    } else {
        var material = new THREE.MeshBasicMaterial({
            color:     0x000000,
            wireframe: true
        });
    }

    return material;
}