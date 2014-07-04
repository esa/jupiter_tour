/* Class OrbitingBody: Model & View 
    Inherits Satellite
*/
gui.OrbitingBody = function (id, name, centralBody, orbitalElements, orbitalElementDerivatives, refEpoch, sgp, radius, minRadiusFactor, maxRadiusFactor, maxTimeOfFlight, maxLaunchDelay, scale, meshMaterialURL, surface) {
    astrodynamics.Satellite.call(this, centralBody, orbitalElements, orbitalElementDerivatives, refEpoch, sgp);
    this._id = id;
    this._name = name;
    this._radius = radius;
    this._minRadius = radius * minRadiusFactor;
    this._maxRadius = radius * maxRadiusFactor;
    this._maxTimeOfFlight = maxTimeOfFlight * utility.DAY_TO_SEC;
    this._maxLaunchDelay = maxLaunchDelay * utility.DAY_TO_SEC;
    this._isMouseOver = false;
    this._isActivated = false;
    this._isFaceViewOpened = false;
    this._configurationMode = false;
    this._configurationWindowHover = false;
    this._maxSize = 12;
    this._rotationY = 0.005;
    this._scaleSpeed = 0.075;
    this._scale = scale;
    this._orbitPositions = 400;
    this._configuration = null;
    this._surfaceType = surface.type;
    this._vehicle = null;

    switch (this._surfaceType) {
    case model.SurfaceTypes.TRUNCATED_ICOSAHEDRON:
        this._surface = new model.TruncatedIcosahedronSurface(this, surface.values);
        this._hud = new gui.FaceSelector(this);
        break;
    case model.SurfaceTypes.SPHERE:
        this._surface = new model.SphericalSurface(this, surface.values);
        this._hud = new gui.TimeOfFlightSelector(this);
        break;
    }

    var material = new THREE.MeshPhongMaterial();
    material.map = THREE.ImageUtils.loadTexture(meshMaterialURL);
    var meshGeometry = new THREE.SphereGeometry(this._radius * this._scale, 100, 100);
    var mesh = new THREE.Mesh(meshGeometry, material);
    var orbSVs = this.orbitalStateVectorsAtEpoch(this._refEpoch);
    this._position = orbSVs.position;
    mesh.position = this._position.asTHREE().multiplyScalar(gui.POSITION_SCALE);
    mesh.rotation.x = 1.57;
    mesh.gID = this._id;
    this._bodyMesh = mesh;

    var orbitPositions = this._sampleOrbitPositions(this._orbitPositions / 2, this._refEpoch).map(function (position) {
        return position.multiplyScalar(gui.POSITION_SCALE).asTHREE();
    });
    var spline = new THREE.SplineCurve3(orbitPositions);
    var splinePoints = spline.getPoints(this._orbitPositions);
    meshGeometry = new THREE.Geometry();
    for (var i = 0; i < splinePoints.length; i++) {
        meshGeometry.vertices.push(splinePoints[i]);
    }

    material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.2,
        linewidth: 2,
        transparent: true
    });
    this._orbitMesh = new THREE.Line(meshGeometry, material);
};
gui.OrbitingBody.prototype = Object.create(astrodynamics.Satellite.prototype);
gui.OrbitingBody.prototype.constructor = gui.OrbitingBody;

gui.OrbitingBody.prototype._highlight = function () {
    this._bodyMesh.material.emissive = new THREE.Color(0x19A3FF);
    this._bodyMesh.material.ambient = new THREE.Color(0x19A3FF);
    var material = new THREE.LineBasicMaterial({
        color: 0x19A3FF,
        linewidth: 2,
        transparent: false
    });
    this._orbitMesh.material = material;
};

gui.OrbitingBody.prototype._unhighlight = function () {
    this._bodyMesh.material.emissive = new THREE.Color(0x000000);
    this._bodyMesh.material.ambient = new THREE.Color(0xffffff);
    var material = new THREE.LineBasicMaterial({
        color: 0xffffff,
        opacity: 0.2,
        linewidth: 2,
        transparent: true
    });
    this._orbitMesh.material = material;
};

gui.OrbitingBody.prototype.onViewChange = function (viewDistance) {
    this._hud.onViewChange(viewDistance);
};

gui.OrbitingBody.prototype.onMouseOver = function () {
    this._isMouseOver = true;
    $('html,body').css('cursor', 'pointer');
};

gui.OrbitingBody.prototype.onMouseOut = function () {
    this._isMouseOver = false;
    $('html,body').css('cursor', 'default');
};

gui.OrbitingBody.prototype.isMouseOver = function () {
    return this._isMouseOver;
};

gui.OrbitingBody.prototype.onConfigurationWindowOver = function () {
    this._configurationWindowHover = true;
};

gui.OrbitingBody.prototype.onConfigurationWindowOut = function () {
    this._configurationWindowHover = false;
};

gui.OrbitingBody.prototype.onConfigurationDone = function (isConfirmed, configuration) {
    this._hud.hide();
    this._bodyMesh.scale.set(1, 1, 1);
    if (isConfirmed) {
        this._configuration = utility.clone(configuration);
    } else {
        this._configuration = null;
    }
    this._configurationMode = false;
};

gui.OrbitingBody.prototype.isInConfigurationMode = function () {
    return this._configurationMode;
};

gui.OrbitingBody.prototype.onActivated = function (epoch, vehicle) {
    this._surface.updateFaces(epoch, vehicle.getVelocityInf());
    this._highlight();
    this._vehicle = vehicle.clone();
    this._isActivated = true;
};

gui.OrbitingBody.prototype.onDeactivated = function () {
    this._unhighlight();
    this._vehicle = null;
    this._isActivated = false;
};

gui.OrbitingBody.prototype.openConfigurationWindow = function () {
    this._bodyMesh.scale.set(4, 4, 4);
    this._hud.show(true);
    this._configurationMode = true;
};

gui.OrbitingBody.prototype.update = function (screenPosition) {
    this._bodyMesh.rotation.y += this._rotationY % (2 * Math.PI);
    var size = this._bodyMesh.scale.lengthManhattan();
    if (this._isMouseOver) {
        if (size < this._maxSize) {
            this._bodyMesh.scale.multiplyScalar(1 + this._scaleSpeed);
        } else {
            if (!this._hud.isVisible()) {
                this._hud.show(false);
            }
        }
    } else {
        if (!this._configurationMode && !this._configurationWindowHover) {
            if (this._hud.isVisible()) {
                this._hud.hide();
            }
            if (size > 3) {
                this._bodyMesh.scale.multiplyScalar(1 - this._scaleSpeed);
            } else {
                this._bodyMesh.scale.set(1, 1, 1);
            }
        }
    }
    this._hud.update(screenPosition);
};

gui.OrbitingBody.prototype._displayOrbitAtEpoch = function (epoch) {
    var orbitPositions = this._sampleOrbitPositions(this._orbitPositions / 2, epoch).map(function (position) {
        return position.multiplyScalar(gui.POSITION_SCALE).asTHREE();
    });
    var spline = new THREE.SplineCurve3(orbitPositions);
    var splinePoints = spline.getPoints(this._orbitPositions);
    for (var i = 0; i < this._orbitPositions; i++) {
        this._orbitMesh.geometry.vertices[i] = splinePoints[i];
    }
    this._orbitMesh.geometry.verticesNeedUpdate = true;
};

gui.OrbitingBody.prototype.displayAtEpoch = function (epoch) {
    var orbSVs = this.orbitalStateVectorsAtEpoch(epoch);
    this._position = orbSVs.position;
    var newPos = this._position.asTHREE().multiplyScalar(gui.POSITION_SCALE);
    this._bodyMesh.position = newPos;
    this._displayOrbitAtEpoch(epoch);
};

gui.OrbitingBody.prototype.getPosition = function () {
    return this._position.clone();
};

gui.OrbitingBody.prototype.getID = function () {
    return this._id;
};

gui.OrbitingBody.prototype.getName = function () {
    return this._name;
};

gui.OrbitingBody.prototype.getRadius = function () {
    return this._radius;
};

gui.OrbitingBody.prototype.getMinRadius = function () {
    return this._minRadius;
};

gui.OrbitingBody.prototype.getMaxRadius = function () {
    return this._maxRadius;
};

gui.OrbitingBody.prototype.getMaxTimeOfFlight = function () {
    return this._maxTimeOfFlight;
};

gui.OrbitingBody.prototype.getMaxLaunchDelay = function () {
    return this._maxLaunchDelay;
};

gui.OrbitingBody.prototype.isFaceVisited = function (faceID) {
    return this._surface.isFaceVisited(faceID);
};

gui.OrbitingBody.prototype.setFaceVisited = function (faceID, isVisited) {
    this._surface.setFaceVisited(faceID, isVisited);
};

gui.OrbitingBody.prototype.isNewestVisitCoords = function (faceID, coordsID) {
    return this._surface.isNewestVisitCoords(faceID, coordsID);
};

gui.OrbitingBody.prototype.setFaceSelected = function (faceID, isSelected) {
    this._surface.setFaceSelected(faceID, isSelected);
};

gui.OrbitingBody.prototype.isFaceVisitable = function (faceID) {
    return this._surface.isFaceVisitable(faceID);
};

gui.OrbitingBody.prototype.isFaceSelected = function (faceID) {
    return this._surface.isFaceSelected(faceID);
};

gui.OrbitingBody.prototype.getFaceBetaBounds = function (faceID) {
    return this._surface.getFaceBetaBounds(faceID);
};

gui.OrbitingBody.prototype.getFaceValue = function (faceID) {
    return this._surface.getFaceValue(faceID);
};

gui.OrbitingBody.prototype.getFaceRadiusBounds = function (faceID) {
    return this._surface.getFaceRadiusBounds(faceID);
};

gui.OrbitingBody.prototype.getConfiguration = function () {
    return this._configuration;
};

gui.OrbitingBody.prototype.computeFlybyFaceAndCoords = function (epoch, velocityInf, beta, radius) {
    var periapsis = astrodynamics.computePeriapsis(this, epoch, velocityInf, beta, radius);
    return this._surface.computeFlybyFaceAndCoords(periapsis);
};

gui.OrbitingBody.prototype.setFlybyCoords = function (faceID, coords, isNewest) {
    this._surface.setFlybyCoords(faceID, coords, isNewest);
};

gui.OrbitingBody.prototype.getTotalFlybyScore = function () {
    return this._surface.getTotalFlybyScore();
};

gui.OrbitingBody.prototype.reset = function () {
    this._vehicle = null;
    this._surface.reset();
};

gui.OrbitingBody.prototype.getSurfaceType = function () {
    return this._surfaceType;
};

gui.OrbitingBody.prototype.getScale = function () {
    return this._scale;
};

gui.OrbitingBody.prototype.getD3Surface = function () {
    return this._surface.d3jsifySurface();
};

gui.OrbitingBody.prototype.getD3Visits = function () {
    return this._surface.d3jsifyVisitCoords();
};

gui.OrbitingBody.prototype.getBodyMesh = function () {
    return this._bodyMesh;
};

gui.OrbitingBody.prototype.getOrbitMesh = function () {
    return this._orbitMesh;
};