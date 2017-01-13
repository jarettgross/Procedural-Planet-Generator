function generateCube(cubeSize, tessellation) {
	var t = tessellation;

	var geometry = new THREE.Geometry();

	var vertices = geometry.vertices;

	//Generate unit cube
	var vertexIndex = 0;
	for (var i = 0; i < t; i++) {

		//Progress bar update
		if (i !== 0 && i % (Math.floor(t * 0.1)) === 0) postMessage({increment: i});

		for (var j = 0; j < t; j++) {

			//Positive X face of cube
			geometry.vertices.push(
				new THREE.Vector3(0.5, 0.5 - j / t,       0.5 - i / t),
				new THREE.Vector3(0.5, 0.5 - (j + 1) / t, 0.5 - (i + 1) / t),
				new THREE.Vector3(0.5, 0.5 - j / t,       0.5 - (i + 1) / t),
				new THREE.Vector3(0.5, 0.5 - (j + 1) / t, 0.5 - i / t)
			);

			//Negative X face of cube
			geometry.vertices.push(
				new THREE.Vector3(-0.5, 0.5 - j / t,       0.5 - i / t),
				new THREE.Vector3(-0.5, 0.5 - j / t,       0.5 - (i + 1) / t),
				new THREE.Vector3(-0.5, 0.5 - (j + 1) / t, 0.5 - i / t),
				new THREE.Vector3(-0.5, 0.5 - (j + 1) / t, 0.5 - (i + 1) / t)
			);

			//Positive Y face of cube
			geometry.vertices.push(
				new THREE.Vector3(0.5 - j / t,       0.5, 0.5 - i / t),
				new THREE.Vector3(0.5 - j / t,       0.5, 0.5 - (i + 1) / t),
				new THREE.Vector3(0.5 - (j + 1) / t, 0.5, 0.5 - (i + 1) / t),
				new THREE.Vector3(0.5 - (j + 1) / t, 0.5, 0.5 - i / t)
			);

			//Negative Y face of cube
			geometry.vertices.push(
				new THREE.Vector3(0.5 - j / t,       -0.5, 0.5 - i / t),
				new THREE.Vector3(0.5 - (j + 1) / t, -0.5, 0.5 - i / t),
				new THREE.Vector3(0.5 - j / t,       -0.5, 0.5 - (i + 1) / t),
				new THREE.Vector3(0.5 - (j + 1) / t, -0.5, 0.5 - (i + 1) / t)
			);

			//Positive Z face of cube
			geometry.vertices.push(
				new THREE.Vector3(0.5 - j / t,       0.5 - i / t,       0.5),
				new THREE.Vector3(0.5 - (j + 1) / t, 0.5 - i / t,       0.5),
				new THREE.Vector3(0.5 - (j + 1) / t, 0.5 - (i + 1) / t, 0.5),
				new THREE.Vector3(0.5 - j / t,       0.5 - (i + 1) / t, 0.5)
			);

			//Negative Z face of cube
			geometry.vertices.push(
				new THREE.Vector3(0.5 - j / t,       0.5 - (i + 1) / t, -0.5),
				new THREE.Vector3(0.5 - (j + 1) / t, 0.5 - i / t,       -0.5),
				new THREE.Vector3(0.5 - j / t,       0.5 - i / t,       -0.5),
				new THREE.Vector3(0.5 - (j + 1) / t, 0.5 - (i + 1) / t, -0.5)
			);

			//Positive X face of cube
			geometry.faces.push(new THREE.Face3(
				vertexIndex, ++vertexIndex, ++vertexIndex,  
				[vertices[vertexIndex-2], vertices[vertexIndex-1], vertices[vertexIndex]]));
			geometry.faces.push(new THREE.Face3(
				vertexIndex-2, ++vertexIndex, vertexIndex-2, 
				[vertices[vertexIndex-3], vertices[vertexIndex], vertices[vertexIndex-3]]));

			//Negative X face of cube
			geometry.faces.push(new THREE.Face3(
				++vertexIndex, ++vertexIndex, ++vertexIndex,
			 	[vertices[vertexIndex-2], vertices[vertexIndex-1], vertices[vertexIndex]]));
			geometry.faces.push(new THREE.Face3(
				vertexIndex,   vertexIndex-1, ++vertexIndex,
				[vertices[vertexIndex-1], vertices[vertexIndex-2], vertices[vertexIndex]]));

			//Positive Y face of cube
			geometry.faces.push(new THREE.Face3(
				++vertexIndex, ++vertexIndex, ++vertexIndex,
				[vertices[vertexIndex-2], vertices[vertexIndex-1], vertices[vertexIndex]]));
			geometry.faces.push(new THREE.Face3(
				vertexIndex,   ++vertexIndex, vertexIndex-3, 
				[vertices[vertexIndex-1], vertices[vertexIndex], vertices[vertexIndex-3]]));

			//Negative Y face of cube
			geometry.faces.push(new THREE.Face3(
				++vertexIndex, ++vertexIndex, ++vertexIndex,
				[vertices[vertexIndex-2], vertices[vertexIndex-1], vertices[vertexIndex]]));
			geometry.faces.push(new THREE.Face3(
				vertexIndex-1, ++vertexIndex, vertexIndex-1,
				[vertices[vertexIndex-2], vertices[vertexIndex], vertices[vertexIndex-1]]));

			//Positive Z face of cube
			geometry.faces.push(new THREE.Face3(
				++vertexIndex, ++vertexIndex, ++vertexIndex,
				[vertices[vertexIndex-2], vertices[vertexIndex-1], vertices[vertexIndex]]));
			geometry.faces.push(new THREE.Face3(
				vertexIndex,   ++vertexIndex, vertexIndex-3,
				[vertices[vertexIndex-1], vertices[vertexIndex], vertices[vertexIndex-3]]));

			//Negative Z face of cube
			geometry.faces.push(new THREE.Face3(
				++vertexIndex, ++vertexIndex, ++vertexIndex,
				[vertices[vertexIndex-2], vertices[vertexIndex-1], vertices[vertexIndex]]));
			geometry.faces.push(new THREE.Face3(
				vertexIndex-2, ++vertexIndex, vertexIndex-2,
				[vertices[vertexIndex-3], vertices[vertexIndex], vertices[vertexIndex-2]]));

			vertexIndex++;
		}
	}

	for (var i = 0; i < geometry.vertices.length; i++) {
		geometry.vertices[i].multiplyScalar(cubeSize);
	}

	return geometry;
}

//Turn cube into a sphere by normalizing each vertex then multiply each vertex by some radius
function generateQuadsphere(radius, tessellation) {
	var quadsphere = generateCube(radius, tessellation);
	quadsphere.mergeVertices();

	for (var i = 0; i < quadsphere.vertices.length; i++) {
		quadsphere.vertices[i].normalize().multiplyScalar(radius);
	}

	return quadsphere;
}

function crossProduct(v1, v2) {
    return new THREE.Vector3(
    	v1.y * v2.z - v1.z * v2.y,
		v1.z * v2.x - v1.x * v2.z,
		v1.x * v2.y - v1.y * v2.x
	);
}