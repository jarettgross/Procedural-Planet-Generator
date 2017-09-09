// Generate subdivided icosahedron
function generateIcosahedron(planetSize = 200, subdivisions = 4) {
    return createIcosahedronGeometry(planetSize, subdivisions);
}

function createIcosahedronGeometry(planetSize, subdivisions) {
    var vertices = [];
    var faces = [];
    var verticesTriangles = [];
    createIcosahedron();
    tessellate();
    return verticesTriangles;

    // Create the vertices and faces of the icosahedron
    function createIcosahedron() {
        // Golden Ratio
        var t = (1 + Math.sqrt(5)) / 2;

        // Create icosahedron vertices
        vertices.push(createVertex( 0,  1,  t));
        vertices.push(createVertex( 0,  1, -t));
        vertices.push(createVertex( 0, -1,  t));
        vertices.push(createVertex( 0, -1, -t));

        vertices.push(createVertex( 1,  t,  0));
        vertices.push(createVertex( 1, -t,  0));
        vertices.push(createVertex(-1,  t,  0));
        vertices.push(createVertex(-1, -t,  0));

        vertices.push(createVertex( t,  0,  1));
        vertices.push(createVertex(-t,  0,  1));
        vertices.push(createVertex( t,  0, -1));
        vertices.push(createVertex(-t,  0, -1));

        // Create icosahedron faces

        // Body of icosahedron (strip)
        faces.push(new THREE.Face3(0,  2,  8));
        faces.push(new THREE.Face3(0,  8,  4));
        faces.push(new THREE.Face3(0,  9,  2));
        faces.push(new THREE.Face3(1,  3, 11));
        faces.push(new THREE.Face3(1,  4, 10));
        faces.push(new THREE.Face3(1, 10,  3));
        faces.push(new THREE.Face3(4,  8, 10));
        faces.push(new THREE.Face3(7,  2,  9));
        faces.push(new THREE.Face3(7,  9, 11));
        faces.push(new THREE.Face3(7, 11,  3));

        // Top of icosahedron (fan)
        faces.push(new THREE.Face3(5,  2,  7));
        faces.push(new THREE.Face3(5,  3, 10));
        faces.push(new THREE.Face3(5,  7,  3));
        faces.push(new THREE.Face3(5,  8,  2));
        faces.push(new THREE.Face3(5, 10,  8));

        // Bottom of icosahedron (fan)
        faces.push(new THREE.Face3(6,  0,  4));
        faces.push(new THREE.Face3(6,  1, 11));
        faces.push(new THREE.Face3(6,  4,  1));
        faces.push(new THREE.Face3(6,  9,  0));
        faces.push(new THREE.Face3(6, 11,  9));
    }

    // Tessellate the icosahedron a specified number of times and return a dictionary of vertices to centroid lists
    function tessellate() {
        for (var i = 2; i <= subdivisions; i++) {
            var subFaces = [];

            // Subdivide the triangles by getting their midpoints
            for (var j = 0; j < faces.length; j++) {
                var m1 = getMidpoint(faces[j]['a'], faces[j]['b']);
                var m2 = getMidpoint(faces[j]['b'], faces[j]['c']);
                var m3 = getMidpoint(faces[j]['c'], faces[j]['a']);

                var m1Idx = vertices.indexOf(m1);
                if (m1Idx === -1) {
                    vertices.push(m1);
                    m1Idx = vertices.length - 1;
                }

                var m2Idx = vertices.indexOf(m2);
                if (m2Idx === -1) {
                    vertices.push(m2);
                    m2Idx = vertices.length - 1;
                }

                var m3Idx = vertices.indexOf(m3);
                if (m3Idx === -1) {
                    vertices.push(m3);
                    m3Idx = vertices.length - 1;
                }

                subFaces.push(new THREE.Face3(faces[j]['a'], m1Idx, m3Idx));
                subFaces.push(new THREE.Face3(faces[j]['b'], m2Idx, m1Idx));
                subFaces.push(new THREE.Face3(faces[j]['c'], m3Idx, m2Idx));
                subFaces.push(new THREE.Face3(m1Idx,         m2Idx, m3Idx));

                // If the final tessellation, then store all the centroids in a dictionary, mapping using vertices
                // as keys and a list of the centroids of the triangles that also use the key vertex
                if (i === subdivisions) {
                    addVerticesToDictionary(faces[j]['a'], faces[j]['b'], faces[j]['c'], m1Idx, m2Idx, m3Idx);
                }
            }

            faces = subFaces;
        }
    }

    // Add centroids of triangles to the dictoinary's value list that use the dictionary's key vertex
    function addVerticesToDictionary(v1, v2, v3, m1, m2, m3) {
        if (verticesTriangles[JSON.stringify(vertices[m1])] === undefined) {
            verticesTriangles[JSON.stringify(vertices[m1])] = [];
        }
        if (verticesTriangles[JSON.stringify(vertices[m2])] === undefined) {
            verticesTriangles[JSON.stringify(vertices[m2])] = [];
        }
        if (verticesTriangles[JSON.stringify(vertices[m3])] === undefined) {
            verticesTriangles[JSON.stringify(vertices[m3])] = [];
        }
        if (verticesTriangles[JSON.stringify(vertices[v1])] === undefined) {
            verticesTriangles[JSON.stringify(vertices[v1])] = [];
        }
        if (verticesTriangles[JSON.stringify(vertices[v2])] === undefined) {
            verticesTriangles[JSON.stringify(vertices[v2])] = [];
        }
        if (verticesTriangles[JSON.stringify(vertices[v3])] === undefined) {
            verticesTriangles[JSON.stringify(vertices[v3])] = [];
        }

        // Midpoint 1
        verticesTriangles[JSON.stringify(vertices[m1])].push(getCentroid(vertices[v1], vertices[m1], vertices[m3]));
        verticesTriangles[JSON.stringify(vertices[m1])].push(getCentroid(vertices[v2], vertices[m2], vertices[m1]));
        verticesTriangles[JSON.stringify(vertices[m1])].push(getCentroid(vertices[m1], vertices[m2], vertices[m3]));

        // Midpoint 2
        verticesTriangles[JSON.stringify(vertices[m2])].push(getCentroid(vertices[v2], vertices[m2], vertices[m1]));
        verticesTriangles[JSON.stringify(vertices[m2])].push(getCentroid(vertices[v3], vertices[m3], vertices[m2]));
        verticesTriangles[JSON.stringify(vertices[m2])].push(getCentroid(vertices[m1], vertices[m2], vertices[m3]));

        // Midpoint 3
        verticesTriangles[JSON.stringify(vertices[m3])].push(getCentroid(vertices[v1], vertices[m1], vertices[m3]));
        verticesTriangles[JSON.stringify(vertices[m3])].push(getCentroid(vertices[v3], vertices[m3], vertices[m2]));
        verticesTriangles[JSON.stringify(vertices[m3])].push(getCentroid(vertices[m1], vertices[m2], vertices[m3]));

        // Vertex 1
        verticesTriangles[JSON.stringify(vertices[v1])].push(getCentroid(vertices[v1], vertices[m1], vertices[m3]));

        // Vertex 2
        verticesTriangles[JSON.stringify(vertices[v2])].push(getCentroid(vertices[v2], vertices[m2], vertices[m1]));

        // Vertex 3
        verticesTriangles[JSON.stringify(vertices[v3])].push(getCentroid(vertices[v3], vertices[m3], vertices[m2]));
    }

    function createVertex(x, y, z) {
        return new THREE.Vector3(x, y, z).normalize().multiplyScalar(planetSize);
    }

    function getMidpoint(p1, p2) {
        return new THREE.Vector3(
            (vertices[p1].x + vertices[p2].x) / 2,
            (vertices[p1].y + vertices[p2].y) / 2,
            (vertices[p1].z + vertices[p2].z) / 2
        ).normalize().multiplyScalar(planetSize);
    }

    function getCentroid(v1, v2, v3) {
        return new THREE.Vector3(
            (v1.x + v2.x + v3.x) / 3,
            (v1.y + v2.y + v3.y) / 3,
            (v1.z + v2.z + v3.z) / 3
        );
    }
}
