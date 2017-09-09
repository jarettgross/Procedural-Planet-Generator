//=====================
//WEB WORKER
//=====================

importScripts(
    "lib/three.min.js",
    "lib/noise.js",
    "generateQuadsphere.js",
    "generateIcosahedron.js",
    "generateDualPolyhedron.js"
);

var lacunarity, persistance, octaves;

onmessage = function(e) {
    noise.seed(e.data.seed);
    lacunarity = e.data.lacunarity;
    persistance = e.data.persistance;
    octaves = e.data.octaves;

    postMessage({
        geometry: generatePlanet(e.data.type, e.data.planetSize, e.data.tessellation, e.data.minHeight, e.data.maxHeight),
        ready:    true
    });
};

//=====================
// PLANET FUNCTIONS
//=====================

function generatePlanet(type = "NORMAL", planetSize = 200, tessellation = 60, minHeight = 1.0, maxHeight = 1.2) {
    return (type === "NORMAL")
        ? generateNormalPlanet(planetSize, tessellation, minHeight, maxHeight)
        : generateTilePlanet(type, planetSize, tessellation, minHeight, maxHeight);
}

// Generate a planet using a subdivided icosahedron altered to create hexagonal/pentagonal tiles
function generateTilePlanet(type, planetSize, subdivisions, minHeight, maxHeight) {
    var subdivisions = Math.min(subdivisions, 6);
    var planet = generateDualPolyhedron(planetSize, subdivisions);

    switch (type) {
        case "TILE-FLAT":        return generateNormalTilePlanet(planet, planetSize, minHeight, maxHeight);
        case "TILE-HEIGHT":      return generateHeightTilePlanet(planet, planetSize, minHeight, maxHeight);
        case "TILE-FLAT-HEIGHT": return generateFlatHeightTilePlanet(planet, planetSize, minHeight, maxHeight);
        default:                 return new THREE.Object3D();
    }
}

//=====================
// QUADSPHERE PLANET
//=====================

function generateNormalPlanet(planetSize, tessellation, minHeight, maxHeight) {
    var faceIndices = ['a', 'b', 'c'];
    var planetGeometry = generateQuadsphere(planetSize, tessellation);

    // Find min, max values of noise to use for value mapping
    var values = getMinMaxValues(planetGeometry.vertices, planetSize);

    // Scale vertices based on noise
    for (var i = 0; i < planetGeometry.vertices.length; i++) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(planetGeometry.vertices.length * 0.1)) === 0) postMessage({increment: i});

        var vertex = planetGeometry.vertices[i];
        var height = getNoiseValue(vertex, planetSize/2).map(values.minValue, values.maxValue, minHeight, maxHeight);
        vertex.multiplyScalar(height);

        // Adjust height if at water level. This keeps the water vertices level with each other
        var waterHeight = terrainType.darkGrass.threshold * (maxHeight - minHeight) + minHeight - .0001;
        if (height < waterHeight) {
            vertex.multiplyScalar(waterHeight / height);
        }
    }

    // Change vertex height based on noise and give colors to mesh faces based on largest vertex length
    for (var i = 0; i < planetGeometry.faces.length; i++) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(planetGeometry.faces.length * 0.1)) === 0) postMessage({increment: i});

        var curValue = 0;
        var face = planetGeometry.faces[i];
        for (var j = 0; j < faceIndices.length; j++) {
            curValue = Math.max(curValue, planetGeometry.vertices[face[faceIndices[j]]].length() / planetSize);
        }
        var heightPercent = (curValue - minHeight) / (maxHeight - minHeight);
        setFaceColor(heightPercent, face);
    }

    return planetGeometry;
}

//=====================
// TILE PLANETS
//=====================

// Regular sphere with hexagonal/pentagonal tiles
function generateNormalTilePlanet(planet, planetSize, minHeight, maxHeight) {
    var planetGeometry = planet.geometry;
    var faceIndices = ['a', 'b', 'c'];
    var vertexHeights = [];

    // Find min, max values of noise to use for value mapping
    var values = getMinMaxValues(planetGeometry.vertices, planetSize);

    // Scale vertices based on noise
    for (var i = 0; i < planetGeometry.vertices.length; i++) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(planetGeometry.vertices.length * 0.1)) === 0) postMessage({increment: i});

        var vertex = planetGeometry.vertices[i];
        var height = getNoiseValue(vertex, planetSize/2).map(values.minValue, values.maxValue, minHeight, maxHeight);
        vertexHeights.push(height);
    }

    // Give colors to mesh faces based on largest noise value
    for (var i = 0; i < planet.polygonGroups.length; i++) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(planet.polygonGroups.length * 0.1)) === 0) postMessage({increment: i});

        var faces = planet.polygonGroups[i].faces;
        var average = 0;

        // For each face of polygon
        for (var j = 0; j < faces.length; j++) {
            var faceIndex = faces[j];
            for (var k = 0; k < faceIndices.length; k++) {
                average += vertexHeights[planetGeometry.faces[faceIndex][faceIndices[k]]];
            }
        }

        average /= faceIndices.length * faces.length;
        var heightPercent = (average - minHeight) / (maxHeight - minHeight);
        for (var j = 0; j < faces.length; j++) {
            faceIndex = faces[j];
            setFaceColor(heightPercent, planetGeometry.faces[faceIndex]);
        }
    }

    return planetGeometry;
}

// Sphere with vertices of hexagonal/pentagonal tiles shifted based on noise
function generateHeightTilePlanet(planet, planetSize, minHeight, maxHeight) {
    var planetGeometry = planet.geometry;
    var faceIndices = ['a', 'b', 'c'];

    // Find min, max values of noise to use for value mapping
    var values = getMinMaxValues(planetGeometry.vertices, planetSize);

    // Scale vertices based on noise
    for (var i = 0; i < planetGeometry.vertices.length; i++) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(planetGeometry.vertices.length * 0.1)) === 0) postMessage({increment: i});

        var vertex = planetGeometry.vertices[i];
        var height = getNoiseValue(vertex, planetSize/2).map(values.minValue, values.maxValue, minHeight, maxHeight);
        vertex.multiplyScalar(height);

        // Adjust height if at water level. This keeps the water vertices level with each other
        var waterHeight = terrainType.darkGrass.threshold * (maxHeight - minHeight) + minHeight - .0001;
        if (height < waterHeight) {
            vertex.multiplyScalar(waterHeight / height);
        }
    }

    // Give colors to mesh faces based on largest vertex length
    for (var i = 0; i < planet.polygonGroups.length; i++) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(planet.polygonGroups.length * 0.1)) === 0) postMessage({increment: i});

        var faces = planet.polygonGroups[i].faces;
        var average = 0;

        // For each face of polygon
        for (var j = 0; j < faces.length; j++) {
            var faceIndex = faces[j];
            for (var k = 0; k < faceIndices.length; k++) {
                average += planetGeometry.vertices[planetGeometry.faces[faceIndex][faceIndices[k]]].length() / planetSize;
            }
        }

        average /= faceIndices.length * faces.length;
        var heightPercent = (average - minHeight) / (maxHeight - minHeight);
        for (var j = 0; j < faces.length; j++) {
            faceIndex = faces[j];
            setFaceColor(heightPercent, planetGeometry.faces[faceIndex]);
        }
    }

    return planetGeometry;
}

// Sphere with entire hexagonal/pentagonal tiles "shifted" based on noise
function generateFlatHeightTilePlanet(planet, planetSize, minHeight, maxHeight) {
    var planetGeometry = planet.geometry;
    var geometry = new THREE.Geometry();
    var faceIndices = ['a', 'b', 'c'];
    var vertexHeights = [];

    // Find min, max values of noise to use for value mapping
    var values = getMinMaxValues(planetGeometry.vertices, planetSize);

    // Scale vertices based on noise
    for (var i = 0; i < planetGeometry.vertices.length; i++) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(planetGeometry.vertices.length * 0.1)) === 0) postMessage({increment: i});

        var vertex = planetGeometry.vertices[i];
        var height = getNoiseValue(vertex, planetSize/2).map(values.minValue, values.maxValue, minHeight, maxHeight);
        vertexHeights.push(height);
    }

    // Give colors to mesh faces based on largest noise value
    for (var i = 0; i < planet.polygonGroups.length; i++) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(planet.polygonGroups.length * 0.1)) === 0) postMessage({increment: i});

        var faces = planet.polygonGroups[i].faces;
        var average = 0;

        // For each face of polygon
        for (var j = 0; j < faces.length; j++) {
            var faceIndex = faces[j];
            for (var k = 0; k < faceIndices.length; k++) {
                average += vertexHeights[planetGeometry.faces[faceIndex][faceIndices[k]]];
            }
        }

        average /= faceIndices.length * faces.length;
        var heightPercent = (average - minHeight) / (maxHeight - minHeight);

        // Create polygon meshes for each hexagonal/pentagonal tile
        var polygonGeometry = createPolygonMesh(planetGeometry, planet.polygonGroups[i].vertices, average);
        for (var j = 0; j < polygonGeometry.faces.length; j++) {
            setFaceColor(heightPercent, polygonGeometry.faces[j]);
        }
        geometry.merge(polygonGeometry);
    }

    return geometry;
}

//==================
// HELPER FUNCTIONS
//==================

// Gets value of 3D simplex noise at a vertex
function getNoiseValue(vertex, scale) {
    var amplitude = 1;
    var frequency = 1;
    var value = 0;
    for (var i = 0; i < octaves; i++) {
        value += amplitude * noise.simplex3(frequency * vertex.x / scale, frequency * vertex.y / scale, frequency * vertex.z / scale);
        amplitude *= persistance;
        frequency *= lacunarity;
    }
    return value;
}

// Returns min, max values generated by noise
function getMinMaxValues(vertices, planetSize) {
    var maxValue = Number.MIN_VALUE;
    var minValue = Number.MAX_VALUE;
    for (var i = 0; i < vertices.length; i++) {
        var vertex = vertices[i];
        var value = getNoiseValue(vertex, planetSize/2);
        maxValue = Math.max(maxValue, value);
        minValue = Math.min(minValue, value);
    }
    return { minValue, maxValue };
}

// Set color of mesh face based on height of face compared to the face with max height
var terrainType = {
    mountainTop:  { threshold: 0.87, color: 0xC8C8C8 },
    darkMountain: { threshold: 0.85, color: 0x735B5B },
    mountain:     { threshold: 0.76, color: 0x826868 },
    grass:        { threshold: 0.60, color: 0x00FF00 },
    darkGrass:    { threshold: 0.57, color: 0x1FBA04 },
    water:        { threshold: 0.00, color: 0x3CB0D6 }
};

function setFaceColor(heightPercent, face) {
    if (heightPercent > terrainType.mountainTop.threshold) {
        face.color.set(terrainType.mountainTop.color);
    } else if (heightPercent > terrainType.darkMountain.threshold) {
        face.color.set(terrainType.darkMountain.color);
    } else if (heightPercent > terrainType.mountain.threshold) {
        face.color.set(terrainType.mountain.color);
    } else if (heightPercent > terrainType.grass.threshold) {
        face.color.set(terrainType.grass.color);
    } else if (heightPercent > terrainType.darkGrass.threshold) {
        face.color.set(terrainType.darkGrass.color);
    } else if (heightPercent > terrainType.water.threshold) {
        face.color.set(terrainType.water.color);
    }
}

// Create mesh from polygon for flat-height tile terrain
function createPolygonMesh(planetGeometry, polygon, height) {
    var geometry = new THREE.Geometry();
    var vertices = planetGeometry.vertices;

    // Top vertices of cylinder
    for (var i = 0; i < polygon.length; i++) {
        var vertexIndex = polygon[i];
        geometry.vertices.push(vertices[vertexIndex].clone().multiplyScalar(height));
    }

    // Bottom vertices of cylinder
    for (var i = 0; i < polygon.length; i++) {
        var vertexIndex = polygon[i];
        geometry.vertices.push(vertices[vertexIndex].clone());
    }

    if (polygon.length === 6) {
        // Top faces
        geometry.faces.push(new THREE.Face3(0,  1,  2));
        geometry.faces.push(new THREE.Face3(0,  2,  3));
        geometry.faces.push(new THREE.Face3(0,  3,  4));
        geometry.faces.push(new THREE.Face3(0,  4,  5));
        geometry.faces.push(new THREE.Face3(0,  5,  1));

        // Bottom faces
        geometry.faces.push(new THREE.Face3(6,  7,  8));
        geometry.faces.push(new THREE.Face3(6,  8,  9));
        geometry.faces.push(new THREE.Face3(6,  9, 10));
        geometry.faces.push(new THREE.Face3(6, 10, 11));
        geometry.faces.push(new THREE.Face3(6, 11,  7));

        // Body faces (one tessellation)
        geometry.faces.push(new THREE.Face3(1,  7,  2));
        geometry.faces.push(new THREE.Face3(2,  7,  8));
        geometry.faces.push(new THREE.Face3(2,  8,  3));
        geometry.faces.push(new THREE.Face3(3,  8,  9));
        geometry.faces.push(new THREE.Face3(3,  9,  4));
        geometry.faces.push(new THREE.Face3(4,  9, 10));
        geometry.faces.push(new THREE.Face3(4, 10,  5));
        geometry.faces.push(new THREE.Face3(5, 10, 11));
        geometry.faces.push(new THREE.Face3(5, 11,  1));
        geometry.faces.push(new THREE.Face3(1, 11,  7));
    } else {
        // Top faces
        geometry.faces.push(new THREE.Face3(0,  1,  2));
        geometry.faces.push(new THREE.Face3(0,  2,  3));
        geometry.faces.push(new THREE.Face3(0,  3,  4));
        geometry.faces.push(new THREE.Face3(0,  4,  5));
        geometry.faces.push(new THREE.Face3(0,  5,  6));
        geometry.faces.push(new THREE.Face3(0,  6,  1));

        // Bottom faces
        geometry.faces.push(new THREE.Face3(7,  8,  9));
        geometry.faces.push(new THREE.Face3(7,  9, 10));
        geometry.faces.push(new THREE.Face3(7, 10, 11));
        geometry.faces.push(new THREE.Face3(7, 11, 12));
        geometry.faces.push(new THREE.Face3(7, 12, 13));
        geometry.faces.push(new THREE.Face3(7, 13,  8));

        // Body faces (one tessellation)
        geometry.faces.push(new THREE.Face3(1,  8,  2));
        geometry.faces.push(new THREE.Face3(2,  8,  9));
        geometry.faces.push(new THREE.Face3(2,  9,  3));
        geometry.faces.push(new THREE.Face3(3,  9, 10));
        geometry.faces.push(new THREE.Face3(3, 10,  4));
        geometry.faces.push(new THREE.Face3(4, 10, 11));
        geometry.faces.push(new THREE.Face3(4, 11,  5));
        geometry.faces.push(new THREE.Face3(5, 11, 12));
        geometry.faces.push(new THREE.Face3(5, 12,  6));
        geometry.faces.push(new THREE.Face3(6, 12, 13));
        geometry.faces.push(new THREE.Face3(6, 13,  1));
        geometry.faces.push(new THREE.Face3(1, 13,  8));
    }

    return geometry;
}

// Map values (in_min, in_max) to (out_min, out_max)
Number.prototype.map = function(in_min, in_max, out_min, out_max) {
    return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}
