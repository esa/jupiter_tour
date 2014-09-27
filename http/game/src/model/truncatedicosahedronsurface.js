/* Class TruncatedIcosahedronSurface
    Represents the SmallBody surface as a truncated icosahedron.
    Inherits Surface
 */
model.TruncatedIcosahedronSurface = function (orbitingBody, faceValues) {
    model.Surface.call(this, orbitingBody);

    this._faceVertexDictionary = {
        1: [56, 52, 54, 58, 60, 59],
        2: [44, 36, 46, 54, 52],
        3: [26, 16, 8, 10, 18],
        4: [2, 6, 10, 8, 4, 1],
        5: [9, 5, 2, 1, 3, 7],
        6: [17, 9, 7, 15, 25],
        7: [43, 51, 53, 45, 35],
        8: [51, 55, 59, 60, 57, 53],
        9: [60, 58, 50, 49, 57],
        10: [58, 54, 46, 38, 42, 50],
        11: [4, 8, 16, 24, 20, 12],
        12: [1, 4, 12, 11, 3],
        13: [7, 3, 11, 19, 23, 15],
        14: [53, 57, 49, 41, 37, 45],
        15: [41, 49, 50, 42, 32, 31],
        16: [21, 31, 32, 22, 14, 13],
        17: [32, 42, 38, 28, 22],
        18: [46, 36, 26, 18, 28, 38],
        19: [16, 26, 36, 44, 34, 24],
        20: [20, 24, 34, 40, 30],
        21: [19, 11, 12, 20, 30, 29],
        22: [39, 29, 30, 40, 48, 47],
        23: [23, 19, 29, 39, 33],
        24: [23, 33, 43, 35, 25, 15],
        25: [35, 45, 37, 27, 17, 25],
        26: [37, 41, 31, 21, 27],
        27: [13, 14, 6, 2, 5],
        28: [14, 22, 28, 18, 10, 6],
        29: [48, 40, 34, 44, 52, 56],
        30: [47, 48, 56, 59, 55],
        31: [33, 39, 47, 55, 51, 43],
        32: [27, 21, 13, 5, 9, 17]
    };

    this._faceNeighbors = {
        1: [2, 9, 30],
        2: [1, 10, 18, 19, 29],
        3: [4, 11, 18, 19, 28],
        4: [3, 12, 27],
        5: [6, 12, 27],
        6: [32, 5, 13, 24, 25],
        7: [8, 14, 24, 25, 31],
        8: [7, 9, 30],
        9: [1, 8, 10, 14, 15],
        10: [2, 9, 17],
        11: [3, 12, 20],
        12: [4, 5, 11, 13, 21],
        13: [6, 12, 23],
        14: [7, 9, 26],
        15: [9, 17, 26],
        16: [17, 26, 27],
        17: [10, 15, 16, 18, 28],
        18: [2, 3, 17],
        19: [2, 3, 20],
        20: [11, 19, 21, 22, 29],
        21: [12, 20, 23],
        22: [20, 23, 30],
        23: [13, 21, 22, 24, 31],
        24: [6, 7, 23],
        25: [6, 7, 26],
        26: [32, 14, 15, 16, 25],
        27: [32, 4, 5, 16, 28],
        28: [3, 17, 27],
        29: [2, 20, 30],
        30: [1, 8, 22, 29, 31],
        31: [7, 23, 30],
        32: [6, 26, 27]
    };

    this._vertexPositions = {
        1: new geometry.Vector3(-4.854101966249685, -1, 0),
        2: new geometry.Vector3(-4.854101966249685, 1, 0),
        3: new geometry.Vector3(-4.23606797749979, -2, -1.618033988749895),
        4: new geometry.Vector3(-4.23606797749979, -2, 1.618033988749895),
        5: new geometry.Vector3(-4.23606797749979, 2, -1.618033988749895),
        6: new geometry.Vector3(-4.23606797749979, 2, 1.618033988749895),
        7: new geometry.Vector3(-3.618033988749895, -1, -3.23606797749979),
        8: new geometry.Vector3(-3.618033988749895, -1, 3.23606797749979),
        9: new geometry.Vector3(-3.618033988749895, 1, -3.23606797749979),
        10: new geometry.Vector3(-3.618033988749895, 1, 3.23606797749979),
        11: new geometry.Vector3(-3.23606797749979, -3.618033988749895, -1),
        12: new geometry.Vector3(-3.23606797749979, -3.618033988749895, 1),
        13: new geometry.Vector3(-3.23606797749979, 3.618033988749895, -1),
        14: new geometry.Vector3(-3.23606797749979, 3.618033988749895, 1),
        15: new geometry.Vector3(-2, -1.618033988749895, -4.23606797749979),
        16: new geometry.Vector3(-2, -1.618033988749895, 4.23606797749979),
        17: new geometry.Vector3(-2, 1.618033988749895, -4.23606797749979),
        18: new geometry.Vector3(-2, 1.618033988749895, 4.23606797749979),
        19: new geometry.Vector3(-1.618033988749895, -4.23606797749979, -2),
        20: new geometry.Vector3(-1.618033988749895, -4.23606797749979, 2),
        21: new geometry.Vector3(-1.618033988749895, 4.23606797749979, -2),
        22: new geometry.Vector3(-1.618033988749895, 4.23606797749979, 2),
        23: new geometry.Vector3(-1, -3.23606797749979, -3.618033988749895),
        24: new geometry.Vector3(-1, -3.23606797749979, 3.618033988749895),
        25: new geometry.Vector3(-1, 0, -4.854101966249685),
        26: new geometry.Vector3(-1, 0, 4.854101966249685),
        27: new geometry.Vector3(-1, 3.23606797749979, -3.618033988749895),
        28: new geometry.Vector3(-1, 3.23606797749979, 3.618033988749895),
        29: new geometry.Vector3(0, -4.854101966249685, -1),
        30: new geometry.Vector3(0, -4.854101966249685, 1),
        31: new geometry.Vector3(0, 4.854101966249685, -1),
        32: new geometry.Vector3(0, 4.854101966249685, 1),
        33: new geometry.Vector3(1, -3.23606797749979, -3.618033988749895),
        34: new geometry.Vector3(1, -3.23606797749979, 3.618033988749895),
        35: new geometry.Vector3(1, 0, -4.854101966249685),
        36: new geometry.Vector3(1, 0, 4.854101966249685),
        37: new geometry.Vector3(1, 3.23606797749979, -3.618033988749895),
        38: new geometry.Vector3(1, 3.23606797749979, 3.618033988749895),
        39: new geometry.Vector3(1.618033988749895, -4.23606797749979, -2),
        40: new geometry.Vector3(1.618033988749895, -4.23606797749979, 2),
        41: new geometry.Vector3(1.618033988749895, 4.23606797749979, -2),
        42: new geometry.Vector3(1.618033988749895, 4.23606797749979, 2),
        43: new geometry.Vector3(2, -1.618033988749895, -4.23606797749979),
        44: new geometry.Vector3(2, -1.618033988749895, 4.23606797749979),
        45: new geometry.Vector3(2, 1.618033988749895, -4.23606797749979),
        46: new geometry.Vector3(2, 1.618033988749895, 4.23606797749979),
        47: new geometry.Vector3(3.23606797749979, -3.618033988749895, -1),
        48: new geometry.Vector3(3.23606797749979, -3.618033988749895, 1),
        49: new geometry.Vector3(3.23606797749979, 3.618033988749895, -1),
        50: new geometry.Vector3(3.23606797749979, 3.618033988749895, 1),
        51: new geometry.Vector3(3.618033988749895, -1, -3.23606797749979),
        52: new geometry.Vector3(3.618033988749895, -1, 3.23606797749979),
        53: new geometry.Vector3(3.618033988749895, 1, -3.23606797749979),
        54: new geometry.Vector3(3.618033988749895, 1, 3.23606797749979),
        55: new geometry.Vector3(4.23606797749979, -2, -1.618033988749895),
        56: new geometry.Vector3(4.23606797749979, -2, 1.618033988749895),
        57: new geometry.Vector3(4.23606797749979, 2, -1.618033988749895),
        58: new geometry.Vector3(4.23606797749979, 2, 1.618033988749895),
        59: new geometry.Vector3(4.854101966249685, -1, 0),
        60: new geometry.Vector3(4.854101966249685, 1, 0)
    };

    this._icosahedronVertexPositions = {
        2: new geometry.Vector3(12.23606797749979, 0.0, 19.798373876248846),
        3: new geometry.Vector3(-12.23606797749979, 0.0, 19.798373876248846),
        6: new geometry.Vector3(-12.23606797749979, 0.0, -19.798373876248846),
        7: new geometry.Vector3(12.23606797749979, 0.0, -19.798373876248846),
        9: new geometry.Vector3(19.798373876248846, 12.23606797749979, 0.0),
        12: new geometry.Vector3(-19.798373876248846, -12.23606797749979, 0.0),
        17: new geometry.Vector3(0.0, 19.798373876248846, 12.23606797749979),
        20: new geometry.Vector3(0.0, -19.798373876248846, 12.23606797749979),
        23: new geometry.Vector3(0.0, -19.798373876248842, -12.23606797749979),
        26: new geometry.Vector3(0.0, 19.798373876248842, -12.23606797749979),
        27: new geometry.Vector3(-19.798373876248846, 12.23606797749979, 0.0),
        30: new geometry.Vector3(19.798373876248846, -12.23606797749979, 0.0)
    };

    this._icosahedronFaceNormals = {
        1: new geometry.Vector3(51.83281572999748, 0.0, 19.798373876248846),
        4: new geometry.Vector3(-51.83281572999748, 0.0, 19.798373876248846),
        5: new geometry.Vector3(-51.83281572999748, 0.0, -19.798373876248846),
        8: new geometry.Vector3(51.83281572999748, 0.0, -19.798373876248846),
        10: new geometry.Vector3(32.03444185374863, 32.03444185374863, 32.03444185374863),
        11: new geometry.Vector3(-32.03444185374863, -32.03444185374863, 32.03444185374863),
        13: new geometry.Vector3(-32.03444185374863, -32.03444185374863, -32.03444185374863),
        14: new geometry.Vector3(32.03444185374863, 32.03444185374863, -32.03444185374863),
        15: new geometry.Vector3(19.798373876248846, 51.83281572999748, 0.0),
        16: new geometry.Vector3(-19.798373876248846, 51.83281572999748, 0.0),
        18: new geometry.Vector3(0.0, 19.798373876248846, 51.83281572999748),
        19: new geometry.Vector3(0.0, -19.798373876248846, 51.83281572999748),
        21: new geometry.Vector3(-19.798373876248846, -51.83281572999748, 0.0),
        22: new geometry.Vector3(19.798373876248846, -51.83281572999748, 0.0),
        24: new geometry.Vector3(0.0, -19.798373876248842, -51.83281572999748),
        25: new geometry.Vector3(0.0, 19.798373876248842, -51.83281572999748),
        28: new geometry.Vector3(-32.03444185374863, 32.03444185374863, 32.03444185374863),
        29: new geometry.Vector3(32.03444185374863, -32.03444185374863, 32.03444185374863),
        31: new geometry.Vector3(32.03444185374863, -32.03444185374863, -32.03444185374863),
        32: new geometry.Vector3(-32.03444185374863, 32.03444185374863, -32.03444185374863)
    };

    this._faceVisitCoords = {};
    this._faceValues = {};
    this._faceVisited = {};
    this._faceVisitable = {};
    this._faceSelected = {};
    this._betaBounds = {};
    this._radiusBounds = {};
    this._newestFaceVisitID = '';

    for (var i = 1; i <= 32; i++) {
        this._faceVisited[i] = false;
        this._faceVisitable[i] = false;
        this._faceSelected[i] = false;
        this._betaBounds[i] = [];
        this._radiusBounds[i] = [];
        this._faceVisitCoords[i] = [];
        this._faceValues[i] = 0 || faceValues[i];
    }
};
model.TruncatedIcosahedronSurface.prototype = Object.create(model.Surface.prototype);
model.TruncatedIcosahedronSurface.prototype.constructor = model.TruncatedIcosahedronSurface;
model.TruncatedIcosahedronSurface.prototype.isFaceVisited = function (faceID) {
    return this._faceVisited[faceID];
};

model.TruncatedIcosahedronSurface.prototype.setFaceVisited = function (faceID, isVisited) {
    this._faceVisited[faceID] = isVisited;
};

model.TruncatedIcosahedronSurface.prototype.setFlybyCoords = function (faceID, coordsArray, isNewest) {
    this.setFaceVisited(faceID, true);
    this._faceVisitCoords[faceID] = coordsArray.clone();
    if (isNewest) {
        this._newestFaceVisitID = faceID.toString() + '_' + (this._faceVisitCoords[faceID].length - 1).toString();
    }
};

model.TruncatedIcosahedronSurface.prototype.isFaceVisitable = function (faceID) {
    return this._faceVisitable[faceID];
};

model.TruncatedIcosahedronSurface.prototype.setFaceVisitable = function (faceID, isVisitable) {
    this._faceVisitable[faceID] = isVisitable;
};

model.TruncatedIcosahedronSurface.prototype.getFaceValue = function (faceID) {
    if (this._faceVisited[faceID]) {
        return 0;
    }
    return this._faceValues[faceID];
};

model.TruncatedIcosahedronSurface.prototype.setFaceValue = function (faceID, value) {
    this._faceValues[faceID] = value;
};

model.TruncatedIcosahedronSurface.prototype.isFaceSelected = function (faceID) {
    return this._faceSelected[faceID];
};

model.TruncatedIcosahedronSurface.prototype.setFaceSelected = function (faceID, isSelected) {
    this._faceSelected[faceID] = isSelected;
};

model.TruncatedIcosahedronSurface.prototype.getFaceBetaBounds = function (faceID) {
    return this._betaBounds[faceID].clone();
};

model.TruncatedIcosahedronSurface.prototype.getFaceRadiusBounds = function (faceID) {
    return this._radiusBounds[faceID].clone();
};

model.TruncatedIcosahedronSurface.prototype.reset = function () {
    this._newestFaceVisitID = '';
    for (var i = 1; i <= 32; i++) {
        this._faceVisited[i] = false;
        this._faceVisitable[i] = false;
        this._faceSelected[i] = false;
        this._betaBounds[i] = [];
        this._radiusBounds[i] = [];
        this._faceVisitCoords[i] = [];
    }
};

model.TruncatedIcosahedronSurface.prototype.updateFaces = function (epoch, velocityInf) {
    velocityInf = velocityInf.clone();

    var radiusRange = [this._orbitingBody.getMinRadius(), this._orbitingBody.getMaxRadius()];

    // SmallBody ephemerides
    var eph = this._orbitingBody.orbitalStateVectorsAtEpoch(epoch);
    var position = eph.position;
    var velocity = eph.velocity;

    // SmallBody body axis
    var b1Hat = position.clone().multiplyScalar(-1);
    var b3Hat = new geometry.Vector3().crossVectors(position, velocity);
    var b2Hat = new geometry.Vector3().crossVectors(b3Hat, b1Hat);
    b1Hat.normalize();
    b2Hat.normalize();
    b3Hat.normalize();

    // We loop over the faces
    for (var faceID = 1; faceID <= 32; faceID++) {
        this._faceVisitable[faceID] = false;
        // Here we store the reason for a vertex rebuttal
        var vertexChecks = [];
        // For each face we loop over its vertexes
        var vertices = [];

        for (var i = 0; i < this._faceVertexDictionary[faceID].length; i++) {
            vertices.push(this._vertexPositions[this._faceVertexDictionary[faceID][i]].clone());
        }
        for (var i = 0; i < vertices.length; i++) {
            var vertice = vertices[i];
            // And compute the vertex vector in the absolute frame (p) and
            // The relative outgoing velocity needed to actually observe the given vertex

            var vertexAbs = b1Hat.clone().multiplyScalar(vertice.getX()).add(b2Hat.clone().multiplyScalar(vertice.getY())).add(b3Hat.clone().multiplyScalar(vertice.getZ()));
            //var vertexAbs = core.addition(core.addition(core.multiplication(b_hat[0], b[0]), core.multiplication(b_hat[1], b[1])), core.multiplication(b_hat[2], b[2]));

            if (vertexAbs.dot(velocityInf) < 0.0) {

                /** !! WAS: vertex_checks[ vtx ] = 'dot'; */
                vertexChecks[i] = [false, false]; // vertex in the visible hemisphere (unreachable)
                continue;
            }

            var velocityInfOut = astrodynamics.velocityInfOutFromPosition(velocityInf, vertexAbs);

            // We now know the vertex is in the far hemisphere: there exist a value of rp to reach it. We check that
            // this valuse is within the allowed bounds
            var constraints = astrodynamics.flybyConstraints(velocityInf, velocityInfOut, this._orbitingBody);

            vertexChecks[i] = [constraints.inequality[0] < 0, constraints.inequality[1] < 0];
            // (True, True): vertex within the band; can be reached directly
            // (False, True): vertex in between the band and the "relative" equator
            // (True, False): vertex is above the band

            // If the vertex is in the band, the face is feasible
            if (constraints.inequality[0] * constraints.inequality[1] > 0) {
                this._faceVisitable[faceID] = true;
                vertexChecks = [];
                break;
            }

            // If no vertex was in the band:
            if (vertexChecks.length == 1) {
                continue;
            }
        }

        if (vertexChecks.length > 0) {
            var checkSet = {};
            for (var i = 0; i < vertexChecks.length; i++) {
                checkSet[vertexChecks[i][0].toString() + vertexChecks[i][1].toString()] = true;
            }
            if (Object.keys(checkSet).length == 1) {
                continue;
            } else {
                if (checkSet['truefalse']) {
                    this._faceVisitable[faceID] = true;
                }
            }
        }
    }


    // Having a list of feasible faces we now try to bracket each face in terms of betas and rps. That is: we look for bounds of betas and rps that
    // would sort-of guarantee us to actually fly over a face.
    for (var faceID = 1; faceID <= 32; faceID++) {
        if (this._faceVisitable[faceID]) {

            var betas = [];
            var radiusBounds = [];

            var vertices = [];
            for (var i = 0; i < this._faceVertexDictionary[faceID].length; i++) {
                vertices.push(this._vertexPositions[this._faceVertexDictionary[faceID][i]].clone());
            }
            for (var i = 0; i < vertices.length; i++) {
                var vertice = vertices[i];
                var vertexAbs = b1Hat.clone().multiplyScalar(vertice.getX()).add(b2Hat.clone().multiplyScalar(vertice.getY())).add(b3Hat.clone().multiplyScalar(vertice.getZ()));
                if (vertexAbs.dot(velocityInf) < 0.0) {
                    betas.push(astrodynamics.positionToBeta(vertexAbs, eph.velocity, velocityInf, true));
                    radiusBounds.push(10e100);
                } else {
                    betas.push(astrodynamics.positionToBeta(vertexAbs, eph.velocity, velocityInf, false));
                    var velocityInfOut = astrodynamics.velocityInfOutFromPosition(velocityInf, vertexAbs);
                    var alpha = Math.acos(velocityInf.dot(velocityInfOut) / velocityInf.normEuclid() / velocityInfOut.normEuclid());
                    var radius = this._orbitingBody.getStandardGravitationalParameter() / velocityInf.dotMe() * (1 / Math.sin(alpha / 2) - 1);
                    radiusBounds.push(radius);
                }
            }

            betas.sort(function (val1, val2) {
                return val1 - val2;
            });

            var betaBounds = [betas[0], betas[betas.length - 1]];

            if (betaBounds[1] - betaBounds[0] > Math.PI) {
                for (var i = 0; i < betas.length; i++) {
                    if (betas[i] < 0) {
                        betas[i] += 2 * Math.PI;
                    }
                }
                betas.sort(function (val1, val2) {
                    return val1 - val2;
                });
                betaBounds = [betas[0], betas[betas.length - 1]];
            }

            radiusBounds.sort(function (val1, val2) {
                return val1 - val2;
            });

            this._betaBounds[faceID] = betaBounds;


            this._radiusBounds[faceID] = [Math.max(radiusBounds[0], radiusRange[0]) / this._orbitingBody.getRadius(), Math.min(radiusBounds[radiusBounds.length - 1], radiusRange[1]) / this._orbitingBody.getRadius()];
        }
    }
};

model.TruncatedIcosahedronSurface.prototype.computeFlybyFaceAndCoords = function (periapsis) {
    periapsis = periapsis.clone();

    var flatPeriapsis = utility.cartToFlat(periapsis);

    var result = [];
    var faceID = -1;
    var max = Number.MIN_VALUE;
    for (var id in this._icosahedronVertexPositions) {
        var vertex = this._icosahedronVertexPositions[id];
        if (vertex.dot(periapsis) >= max) {
            max = vertex.dot(periapsis);
            faceID = id;
        }
    }
    faceID = parseInt(faceID);

    var dotProducts = [];
    for (var i = 0; i < this._faceNeighbors[faceID].length; i++) {
        var neighborID = this._faceNeighbors[faceID][i];
        dotProducts.push([periapsis.dot(this._icosahedronFaceNormals[neighborID]), neighborID]);
    }
    dotProducts.sort(function (arr1, arr2) {
        return arr2[0] - arr1[0];
    });

    var id = dotProducts[0][1];
    var neighbors = this._faceNeighbors[id];

    if (this._icosahedronVertexPositions[neighbors[0]].dotMe() == 0) {
        return null;
    }

    var dotR = this._icosahedronVertexPositions[neighbors[0]].dot(this._icosahedronVertexPositions[neighbors[1]]) / this._icosahedronVertexPositions[neighbors[0]].dotMe();

    var sum = 0;
    for (var i = 0; i < neighbors.length; i++) {
        sum += periapsis.dot(this._icosahedronVertexPositions[neighbors[i]]);
    }
    var dotL = (2 + dotR) * sum;
    var dotRH = (3 + 6 * dotR) * periapsis.dot(this._icosahedronVertexPositions[faceID]);

    if (dotL < dotRH) {
        result.push(faceID);
    } else if (dotL == dotRH) {
        if (dotProducts[0][0] == dotProducts[1][0]) {
            result.push(dotProducts[0][1]);
            result.push(dotProducts[1][1]);
            result.push(faceID);
        } else {
            result.push(dotProducts[0][1]);
            result.push(faceID);
        }
    } else {
        if (dotProducts[0][0] == dotProducts[1][0]) {
            result.push(dotProducts[0][1]);
            result.push(dotProducts[1][1]);
        } else {
            result.push(dotProducts[0][1]);
        }
    }

    return {
        faceID: result[0],
        coords: flatPeriapsis.clone()
    };
};

model.TruncatedIcosahedronSurface.prototype.getTotalValue = function () {
    var sum = 0;
    for (var i = 1; i <= 32; i++) {
        sum += this._faceValues[i];
    }
    return sum;
};

model.TruncatedIcosahedronSurface.prototype.d3jsifySurface = function () {
    var d3SurfaceData = {};
    d3SurfaceData.type = 'FeatureCollection';
    d3SurfaceData.features = [];
    for (var i = 1; i <= 32; i++) {

        var face = {};
        face.type = 'Feature';
        face.id = i;
        face.properties = {};
        face.properties.faceValue = this.getFaceValue(i);
        face.geometry = {};
        face.geometry.type = 'Polygon';
        face.geometry.coordinates = [[]];

        var coordsArray = [];
        for (var j = 0; j < this._faceVertexDictionary[i].length; j++) {
            var coords = utility.cartToFlat(this._vertexPositions[this._faceVertexDictionary[i][j]]).multiplyScalar(utility.RAD_TO_DEG);
            coordsArray.push(coords);
        }
        for (var j = 0; j < coordsArray.length; j++) {
            face.geometry.coordinates[0].push(coordsArray[j].asArray());
        }
        face.geometry.coordinates[0].push(coordsArray[0].asArray());
        d3SurfaceData.features.push(face);
    }
    return d3SurfaceData;
};

model.TruncatedIcosahedronSurface.prototype.d3jsifyVisitCoords = function () {
    var d3Visits = {};
    d3Visits.type = 'FeatureCollection';
    d3Visits.features = [];

    for (var i = 1; i <= 32; i++) {
        for (var j = 0; j < this._faceVisitCoords[i].length; j++) {
            var visit = {};
            visit.type = 'Feature';
            visit.id = i * 100 + j;
            visit.properties = {};
            visit.properties.isNewest = (i.toString() + '_' + j.toString() == this._newestFaceVisitID);
            visit.geometry = {};
            visit.geometry.type = 'Point';
            visit.geometry.coordinates = this._faceVisitCoords[i][j].asArray().map(function (val) {
                return val * utility.RAD_TO_DEG;
            });
            d3Visits.features.push(visit);
        }
    }
    return d3Visits;
};