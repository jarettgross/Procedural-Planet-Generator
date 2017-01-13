function generateDualPolyhedron(planetSize = 200, subdivisions = 4) {
	var planetGeometry = generateIcosahedron(planetSize, subdivisions);

	var geometry = new THREE.Geometry();

	var planetFaces = planetGeometry.faces;

	var vertexCheck;
	var polygonSet = [];
	var faceIndex = 0;

	var polygonGroups = [];
	for (var i = 0; i < planetFaces.length + 20; i++) {

		//Progress bar update
		if (i !== 0 && i % (Math.floor(planetFaces.length * 0.1)) === 0) postMessage({increment: i});

		var polygon = [];

		if (i < planetFaces.length) {
			polygon.push(getCentroid(planetGeometry, planetFaces[i]));

			//Find a polygon not yet computed
			if (polygonSet[planetFaces[i]['a']] !== undefined) {
				if (polygonSet[planetFaces[i]['b']] !== undefined) {
					if (polygonSet[planetFaces[i]['c']] !== undefined) {
						continue;
					} else {
						vertexCheck = planetFaces[i]['c'];
					}
				} else {
					vertexCheck = planetFaces[i]['b'];
				}
			} else {
				vertexCheck = planetFaces[i]['a'];
			}
		} else {
			//Check for polygons not yet created, then create them (20 is an arbitrary buffer)
			var allDefined = true;
			for (var j = 0; j < polygonSet.length; j++) {
				if (polygonSet[j] === undefined) {
					vertexCheck = j;
					allDefined = false;
				}
			}
			if (allDefined) break;
		}

		polygonSet[vertexCheck] = vertexCheck;

		//Find vertices of polygon
		for (var j = 0; j < planetFaces.length; j++) {
            if (planetFaces[j] !== planetFaces[i] && (planetFaces[j]['a'] === vertexCheck || planetFaces[j]['b'] === vertexCheck || planetFaces[j]['c'] === vertexCheck)) {
            	polygon.push(getCentroid(planetGeometry, planetFaces[j]));
            	if (polygon.length === 6) break;
            }
		}

		//Order vertices of polygon (ordered around a circle)
		var orderedPolygon = [polygon[0]];
		var currentVertex = polygon[0];
		for (var j = 1; j < polygon.length; j++) {
			var nearestVertex;
			var minDist = 999999;
			for (var k = 1; k < polygon.length; k++) {
				if (!orderedPolygon.includes(polygon[k])) {
					if (currentVertex.distanceTo(polygon[k]) < minDist) {
						minDist = currentVertex.distanceTo(polygon[k]);
						nearestVertex = polygon[k];
					}
				}
			}
			orderedPolygon.push(nearestVertex);
			currentVertex = nearestVertex;
		}

		//Create mesh
		if (polygon.length === 5) {
			var polygonCenter = new THREE.Vector3(
				(polygon[0].x + polygon[1].x + polygon[2].x + polygon[3].x + polygon[4].x) / 5,
				(polygon[0].y + polygon[1].y + polygon[2].y + polygon[3].y + polygon[4].y) / 5,
				(polygon[0].z + polygon[1].z + polygon[2].z + polygon[3].z + polygon[4].z) / 5
			);
		} else {
			var polygonCenter = new THREE.Vector3(
				(polygon[0].x + polygon[1].x + polygon[2].x + polygon[3].x + polygon[4].x + polygon[5].x) / 6,
				(polygon[0].y + polygon[1].y + polygon[2].y + polygon[3].y + polygon[4].y + polygon[5].y) / 6,
				(polygon[0].z + polygon[1].z + polygon[2].z + polygon[3].z + polygon[4].z + polygon[5].z) / 6
			);
		}
		geometry.vertices.push(polygonCenter);
		var centerIdx = geometry.vertices.length - 1;
		
		//Check if vertices exist before adding them to mesh
		var idxVertices = [];
		var newCount = 0;
		for (var j = 0; j < polygon.length; j++) {
			var idx = -1;
			for (var k = 0; k < geometry.vertices.length; k++) {
				var vertex = geometry.vertices[k];
				if (vertex.x === orderedPolygon[j].x && vertex.y === orderedPolygon[j].y && vertex.z === orderedPolygon[j].z) {
					idx = k;
					break;
				}
			}
			if (idx === -1) {
				geometry.vertices.push(orderedPolygon[j]);
				idxVertices[j] = geometry.vertices.length - 1;
				newCount++;
			} else {
				idxVertices[j] = idx;
			}
		}


		//Determine if order of vertices is clockwise or counterclockwise
		var edgeSum = 0;
		var reverseEdge = false;
		var reversePole = false;
		var centerAngle = geometry.vertices[centerIdx].angleTo(new THREE.Vector3(0,0,-1));

		for (var j = 0; j < polygon.length; j++) {
			//Calculate differently for the poles
			if (geometry.vertices[centerIdx].x === 0 && centerAngle === Math.PI/2) {
				edgeSum += (geometry.vertices[idxVertices[(j+1) % polygon.length]].x - geometry.vertices[idxVertices[j]].x) * 
						   (geometry.vertices[idxVertices[(j+1) % polygon.length]].z + geometry.vertices[idxVertices[j]].z);

				if (geometry.vertices[centerIdx].y > 0) {
					reversePole = true;
				}

			} else if (centerAngle === Math.PI/2) {
				edgeSum += (geometry.vertices[idxVertices[(j+1) % polygon.length]].z - geometry.vertices[idxVertices[j]].z) * 
						   (geometry.vertices[idxVertices[(j+1) % polygon.length]].y + geometry.vertices[idxVertices[j]].y);

				reverseEdge = (geometry.vertices[centerIdx].x > 0);

			} else {
				edgeSum += (geometry.vertices[idxVertices[(j+1) % polygon.length]].x - geometry.vertices[idxVertices[j]].x) * 
						   (geometry.vertices[idxVertices[(j+1) % polygon.length]].y + geometry.vertices[idxVertices[j]].y);
			}
		}

		//Negate sum if on backfacing side
		if (centerAngle > -Math.PI/2 && centerAngle < Math.PI/2) edgeSum *= -1;

		//Negate sum if on top pole
		if (reversePole) edgeSum *= -1;

		//Negate sum if along the edge between frontfacing and backfacing sides
		if (reverseEdge) edgeSum *= -1;


		//Add faces of pentagon/hexagon to mesh and store vertices and faces of the pentagon/hexagon for later use
		if (polygon.length === 5) {
			if (edgeSum < 0) {
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[0], idxVertices[1], 
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[0]], geometry.vertices[idxVertices[1]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[1], idxVertices[2],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[1]], geometry.vertices[idxVertices[2]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[2], idxVertices[3],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[2]], geometry.vertices[idxVertices[3]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[3], idxVertices[4],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[3]], geometry.vertices[idxVertices[4]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[4], idxVertices[0],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[4]], geometry.vertices[idxVertices[0]]]));

				polygonGroups.push({
					vertices: [centerIdx, idxVertices[0], idxVertices[1], idxVertices[2], idxVertices[3], idxVertices[4]],
					faces:    [faceIndex, faceIndex+1, faceIndex+2, faceIndex+3, faceIndex+4]
				});
			} else {
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[1], idxVertices[0],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[1]], geometry.vertices[idxVertices[0]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[2], idxVertices[1],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[2]], geometry.vertices[idxVertices[1]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[3], idxVertices[2],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[3]], geometry.vertices[idxVertices[2]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[4], idxVertices[3],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[4]], geometry.vertices[idxVertices[3]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[0], idxVertices[4],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[0]], geometry.vertices[idxVertices[4]]]));

				polygonGroups.push({
					vertices: [centerIdx, idxVertices[4], idxVertices[3], idxVertices[2], idxVertices[1], idxVertices[0]],
					faces:    [faceIndex, faceIndex+1, faceIndex+2, faceIndex+3, faceIndex+4]
				});
			}

			faceIndex += 5;
		} else {
			if (edgeSum < 0) {
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[0], idxVertices[1], 
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[0]], geometry.vertices[idxVertices[1]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[1], idxVertices[2],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[1]], geometry.vertices[idxVertices[2]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[2], idxVertices[3],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[2]], geometry.vertices[idxVertices[3]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[3], idxVertices[4],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[3]], geometry.vertices[idxVertices[4]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[4], idxVertices[5],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[4]], geometry.vertices[idxVertices[5]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[5], idxVertices[0],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[5]], geometry.vertices[idxVertices[0]]]));

				polygonGroups.push({
					vertices: [centerIdx, idxVertices[0], idxVertices[1], idxVertices[2], idxVertices[3], idxVertices[4], idxVertices[5]],
					faces:    [faceIndex, faceIndex+1, faceIndex+2, faceIndex+3, faceIndex+4, faceIndex+5]
				});
			} else {
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[1], idxVertices[0],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[1]], geometry.vertices[idxVertices[0]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[2], idxVertices[1],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[2]], geometry.vertices[idxVertices[1]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[3], idxVertices[2],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[3]], geometry.vertices[idxVertices[2]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[4], idxVertices[3],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[4]], geometry.vertices[idxVertices[3]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[5], idxVertices[4],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[5]], geometry.vertices[idxVertices[4]]]));
				geometry.faces.push(new THREE.Face3(centerIdx, idxVertices[0], idxVertices[5],
					[geometry.vertices[centerIdx], geometry.vertices[idxVertices[0]], geometry.vertices[idxVertices[5]]]));

				polygonGroups.push({
					vertices: [centerIdx, idxVertices[5], idxVertices[4], idxVertices[3], idxVertices[2], idxVertices[1], idxVertices[0]],
					faces:    [faceIndex, faceIndex+1, faceIndex+2, faceIndex+3, faceIndex+4, faceIndex+5]
				});
			}

			faceIndex += 6;
		}
    }

    return {
    	geometry: geometry,
    	polygonGroups: polygonGroups
    };
}

//==================
//HELPER FUNCTIONS
//==================

//Generate subdivided icosahedron
function generateIcosahedron(planetSize = 200, subdivisions = 4) {
    var planetMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(planetSize, subdivisions), new THREE.MeshBasicMaterial({ color: 0x000000 }));

    return planetMesh.geometry;
}

function getCentroid(geometry, face) {
	var vertices = geometry.vertices;
	var x = (vertices[face['a']].x + vertices[face['b']].x + vertices[face['c']].x) / 3;
	var y = (vertices[face['a']].y + vertices[face['b']].y + vertices[face['c']].y) / 3;
	var z = (vertices[face['a']].z + vertices[face['b']].z + vertices[face['c']].z) / 3;
	return new THREE.Vector3(x, y, z);
}