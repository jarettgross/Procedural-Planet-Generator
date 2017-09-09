function generateDualPolyhedron(planetSize = 200, subdivisions = 4) {
    var verticesTriangles = generateIcosahedron(planetSize, subdivisions);
    var geometry = new THREE.Geometry();
    var faceIndex = 0;
    var polygonGroups = [];

    var i = 0;
    for (var key in verticesTriangles) {
        // Progress bar update
        if (i !== 0 && i % (Math.floor(verticesTriangles.length * 0.1)) === 0) postMessage({increment: i++});

        // Order vertices of polygon (ordered around a circle)
        var polygon = verticesTriangles[key];
        var orderedPolygon = [polygon[0]];
        var currentVertex = polygon[0];
        for (var j = 1; j < polygon.length; j++) {
            var nearestVertex;
            var minDist = Number.MAX_VALUE;
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

        // Create mesh
        var polygonCenter = (polygon.length === 5)
            ? new THREE.Vector3(
                (polygon[0].x + polygon[1].x + polygon[2].x + polygon[3].x + polygon[4].x) / 5,
                (polygon[0].y + polygon[1].y + polygon[2].y + polygon[3].y + polygon[4].y) / 5,
                (polygon[0].z + polygon[1].z + polygon[2].z + polygon[3].z + polygon[4].z) / 5)
            : new THREE.Vector3(
                (polygon[0].x + polygon[1].x + polygon[2].x + polygon[3].x + polygon[4].x + polygon[5].x) / 6,
                (polygon[0].y + polygon[1].y + polygon[2].y + polygon[3].y + polygon[4].y + polygon[5].y) / 6,
                (polygon[0].z + polygon[1].z + polygon[2].z + polygon[3].z + polygon[4].z + polygon[5].z) / 6);

        geometry.vertices.push(polygonCenter);
        var centerIdx = geometry.vertices.length - 1;

        // Check if vertices exist before adding them to mesh
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

        // Determine if order of vertices is clockwise or counterclockwise
        var edgeSum = 0;
        var reverseEdge = false;
        var reversePole = false;
        var centerAngle = geometry.vertices[centerIdx].angleTo(new THREE.Vector3(0,0,-1));

        for (var j = 0; j < polygon.length; j++) {
            // Calculate differently for the poles
            if (geometry.vertices[centerIdx].x === 0 && centerAngle === Math.PI/2) {
                edgeSum += (geometry.vertices[idxVertices[(j+1) % polygon.length]].x - geometry.vertices[idxVertices[j]].x) *
                           (geometry.vertices[idxVertices[(j+1) % polygon.length]].z + geometry.vertices[idxVertices[j]].z);

                reversePole = (geometry.vertices[centerIdx].y > 0);
            } else if (centerAngle === Math.PI/2) {
                edgeSum += (geometry.vertices[idxVertices[(j+1) % polygon.length]].z - geometry.vertices[idxVertices[j]].z) *
                           (geometry.vertices[idxVertices[(j+1) % polygon.length]].y + geometry.vertices[idxVertices[j]].y);

                reverseEdge = (geometry.vertices[centerIdx].x > 0);
            } else {
                edgeSum += (geometry.vertices[idxVertices[(j+1) % polygon.length]].x - geometry.vertices[idxVertices[j]].x) *
                           (geometry.vertices[idxVertices[(j+1) % polygon.length]].y + geometry.vertices[idxVertices[j]].y);
            }
        }

        // Negate sum if on backfacing side, on top pole, or along the edge between frontfacing and backfacing sides
        if (centerAngle > -Math.PI/2 && centerAngle < Math.PI/2 || reversePole || reverseEdge) {
            edgeSum *= -1;
        }

        // Add faces of pentagon/hexagon to mesh and store vertices and faces of the pentagon/hexagon for later use
        if (polygon.length === 5) {
            if (edgeSum < 0) {
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[0], idxVertices[1],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[0]], geometry.vertices[idxVertices[1]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[1], idxVertices[2],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[1]], geometry.vertices[idxVertices[2]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[2], idxVertices[3],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[2]], geometry.vertices[idxVertices[3]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[3], idxVertices[4],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[3]], geometry.vertices[idxVertices[4]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[4], idxVertices[0],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[4]], geometry.vertices[idxVertices[0]]])
                );

                polygonGroups.push({
                    vertices: [centerIdx, idxVertices[0], idxVertices[1], idxVertices[2], idxVertices[3], idxVertices[4]],
                    faces:    [faceIndex, faceIndex+1, faceIndex+2, faceIndex+3, faceIndex+4]
                });
            } else {
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[1], idxVertices[0],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[1]], geometry.vertices[idxVertices[0]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[2], idxVertices[1],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[2]], geometry.vertices[idxVertices[1]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[3], idxVertices[2],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[3]], geometry.vertices[idxVertices[2]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[4], idxVertices[3],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[4]], geometry.vertices[idxVertices[3]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[0], idxVertices[4],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[0]], geometry.vertices[idxVertices[4]]])
                );

                polygonGroups.push({
                    vertices: [centerIdx, idxVertices[4], idxVertices[3], idxVertices[2], idxVertices[1], idxVertices[0]],
                    faces:    [faceIndex, faceIndex+1, faceIndex+2, faceIndex+3, faceIndex+4]
                });
            }

            faceIndex += 5;
        } else {
            if (edgeSum < 0) {
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[0], idxVertices[1],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[0]], geometry.vertices[idxVertices[1]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[1], idxVertices[2],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[1]], geometry.vertices[idxVertices[2]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[2], idxVertices[3],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[2]], geometry.vertices[idxVertices[3]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[3], idxVertices[4],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[3]], geometry.vertices[idxVertices[4]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[4], idxVertices[5],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[4]], geometry.vertices[idxVertices[5]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[5], idxVertices[0],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[5]], geometry.vertices[idxVertices[0]]])
                );

                polygonGroups.push({
                    vertices: [centerIdx, idxVertices[0], idxVertices[1], idxVertices[2], idxVertices[3], idxVertices[4], idxVertices[5]],
                    faces:    [faceIndex, faceIndex+1, faceIndex+2, faceIndex+3, faceIndex+4, faceIndex+5]
                });
            } else {
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[1], idxVertices[0],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[1]], geometry.vertices[idxVertices[0]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[2], idxVertices[1],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[2]], geometry.vertices[idxVertices[1]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[3], idxVertices[2],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[3]], geometry.vertices[idxVertices[2]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[4], idxVertices[3],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[4]], geometry.vertices[idxVertices[3]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[5], idxVertices[4],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[5]], geometry.vertices[idxVertices[4]]])
                );
                geometry.faces.push(new THREE.Face3(
                    centerIdx, idxVertices[0], idxVertices[5],
                    [geometry.vertices[centerIdx], geometry.vertices[idxVertices[0]], geometry.vertices[idxVertices[5]]])
                );

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

function getCentroid(geometry, face) {
    var vertices = geometry.vertices;
    return new THREE.Vector3(x
        (vertices[face['a']].x + vertices[face['b']].x + vertices[face['c']].x) / 3,
        (vertices[face['a']].y + vertices[face['b']].y + vertices[face['c']].y) / 3,
        (vertices[face['a']].z + vertices[face['b']].z + vertices[face['c']].z) / 3
    );
}
