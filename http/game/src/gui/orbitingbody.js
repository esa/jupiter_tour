/* Class OrbitingBody
    Graphical interface class 
    Inherits astrodynamics.OrbitingBody
*/
gui.OrbitingBody = function (id, name, centralBody, orbitalElements, orbitalElementDerivatives, refEpoch, sgp, radius, minRadiusFactor, maxRadiusFactor, maxTimeOfFlight, maxLaunchDelay, arrivalOption, interactionOption, scale, meshMaterialURL, surface) {
    astrodynamics.OrbitingBody.call(this, id, name, centralBody, orbitalElements, orbitalElementDerivatives, refEpoch, sgp, radius, minRadiusFactor, maxRadiusFactor, maxTimeOfFlight, maxLaunchDelay, arrivalOption, interactionOption, surface);

    this._isMouseOver = false;
    this._isActivated = false;
    this._configurationStatus = core.ConfigurationStatus.DELIVERED;
    this._configurationMode = null;
    this._configurationWindowHover = false;
    this._maxSize = 12;
    this._rotationY = 0.005;
    this._scaleSpeed = 0.075;
    this._scale = scale;
    this._orbitPositions = 400;
    this._isSelected = false;
    this._pulseValue = 0;
    this._pulseUp = true;

    this._departureSelector = null;
    this._arrivalSelector = null;

    switch (this._surfaceType) {
    case model.SurfaceTypes.TRUNCATED_ICOSAHEDRON:
        this._surface = new model.TruncatedIcosahedronSurface(this, surface.values);
        this._departureSelector = new gui.FaceSelector(this);
        this._arrivalSelector = new gui.TransferLegFaceSelector(this);
        break;
    case model.SurfaceTypes.SPHERE:
        this._surface = new model.SphericalSurface(this, surface.values);
        this._departureSelector = new gui.SimpleSelector(this);
        this._arrivalSelector = new gui.TransferLegSimpleSelector(this);
        break;
    }

    var material = new THREE.MeshPhongMaterial();
    material.map = THREE.ImageUtils.loadTexture(meshMaterialURL);
    var meshGeometry = new THREE.SphereGeometry(this._radius * this._scale, 100, 100);
    var mesh = new THREE.Mesh(meshGeometry, material);

    mesh.position = new THREE.Vector3(this._position.getX(), this._position.getY(), this._position.getZ()).multiplyScalar(gui.POSITION_SCALE);
    mesh.rotation.x = 1.57;
    mesh.gID = this._id;
    this._bodyMesh = mesh;

    var orbitPositions = this._sampleOrbitPositions(this._orbitPositions / 2, this._refEpoch).map(function (position) {
        var tmpPos = position.multiplyScalar(gui.POSITION_SCALE);
        return new THREE.Vector3(tmpPos.getX(), tmpPos.getY(), tmpPos.getZ());
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
gui.OrbitingBody.prototype = Object.create(astrodynamics.OrbitingBody.prototype);
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

gui.OrbitingBody.prototype._pulse = function () {
    if (this._pulseUp) {
        if (this._pulseValue < 1) {
            this._bodyMesh.material.emissive.setRGB(this._pulseValue * 0.09803921568, this._pulseValue * 0.63921568627, 1);
            this._bodyMesh.material.ambient.setRGB(1 - this._pulseValue * 0.90196078431, 1 - this._pulseValue * 0.36078431372, 1);
            this._pulseValue += 0.01;
        } else {
            this._pulseUp =  false;
        }
    } else {
        if (this._pulseValue > 0) {
            this._bodyMesh.material.emissive.setRGB(this._pulseValue * 0.09803921568, this._pulseValue * 0.63921568627, 1);
            this._bodyMesh.material.ambient.setRGB(1 - this._pulseValue * 0.90196078431, 1 - this._pulseValue * 0.36078431372, 1);
            this._pulseValue -= 0.01;
        } else {
            this._pulseUp = true;
        }
    }
};

gui.OrbitingBody.prototype._getSelector = function () {
    switch (this._configurationMode) {
    case core.TransferLegConfigurationModes.ARRIVAL:
        return this._arrivalSelector;
    case core.TransferLegConfigurationModes.DEPARTURE:
        return this._departureSelector;
    }
};

gui.OrbitingBody.prototype._displayOrbitAtEpoch = function (epoch) {
    var orbitPositions = this._sampleOrbitPositions(this._orbitPositions / 2, epoch).map(function (position) {
        var tmpPos = position.multiplyScalar(gui.POSITION_SCALE);
        return new THREE.Vector3(tmpPos.getX(), tmpPos.getY(), tmpPos.getZ());
    });
    var spline = new THREE.SplineCurve3(orbitPositions);
    var splinePoints = spline.getPoints(this._orbitPositions);
    for (var i = 0; i < this._orbitPositions; i++) {
        this._orbitMesh.geometry.vertices[i] = splinePoints[i];
    }
    this._orbitMesh.geometry.verticesNeedUpdate = true;
};

gui.OrbitingBody.prototype.onSelected = function () {
    this._bodyMesh.scale.set(4, 4, 4);
    this._isSelected = true;
};

gui.OrbitingBody.prototype.onUnselected = function () {
    this._isSelected = false;
};

gui.OrbitingBody.prototype.onMouseOver = function () {
    this._isMouseOver = true;
    $('html,body').css('cursor', 'pointer');
};

gui.OrbitingBody.prototype.onMouseOut = function () {
    this._isMouseOver = false;
    $('html,body').css('cursor', 'default');
};

gui.OrbitingBody.prototype.onConfigurationWindowOver = function () {
    this._configurationWindowHover = true;
};

gui.OrbitingBody.prototype.onConfigurationWindowOut = function () {
    this._configurationWindowHover = false;
};

gui.OrbitingBody.prototype.onConfigurationDone = function (isConfirmed) {
    this._configurationWindowHover = false;
    if (isConfirmed) {
        this._configurationStatus = core.ConfigurationStatus.CONFIRMED;
    } else {
        this._configurationStatus = core.ConfigurationStatus.CANCELED;
    }
};

gui.OrbitingBody.prototype.onActivated = function (epoch, vehicle) {
    this._surface.updateFaces(epoch, vehicle.getVelocityInf());
    this._departureSelector.onActivated(epoch, vehicle);
    this._arrivalSelector.onActivated(epoch, vehicle);
    this._vehicle = vehicle.clone();
    this._isActivated = true;
};

gui.OrbitingBody.prototype.onDeactivated = function () {
    this._departureSelector.onDeactivated();
    this._vehicle = null;
    this._isActivated = false;
};

gui.OrbitingBody.prototype.onConfigurationModeChange = function (configurationMode) {
    this._configurationMode = configurationMode;
};

gui.OrbitingBody.prototype.isMouseOver = function () {
    return this._isMouseOver;
};

gui.OrbitingBody.prototype.getConfigurationStatus = function () {
    return this._configurationStatus;
};

gui.OrbitingBody.prototype.openConfiguration = function (userAction) {
    this._bodyMesh.scale.set(4, 4, 4);
    this._getSelector().show(userAction);
    this._configurationStatus = core.ConfigurationStatus.PENDING;
};

gui.OrbitingBody.prototype.update = function (screenPosition, screenRadius) {
    this._bodyMesh.rotation.y += this._rotationY % (2 * Math.PI);
    var size = this._bodyMesh.scale.lengthManhattan();
    if (this._isMouseOver) {
        if (size < this._maxSize) {
            this._bodyMesh.scale.multiplyScalar(1 + this._scaleSpeed);
        } else {
            var selector = this._getSelector();
            if (!selector.isVisible()) {
                selector.show();
            }
        }
    } else {
        if (!(this._configurationStatus == core.ConfigurationStatus.PENDING) && !this._configurationWindowHover) {
            this._arrivalSelector.hide();
            this._departureSelector.hide();
            if (!this._isSelected) {
                if (size > 3) {
                    this._bodyMesh.scale.multiplyScalar(1 - this._scaleSpeed);
                } else {
                    this._bodyMesh.scale.set(1, 1, 1);
                }
            }
        }
    }
    if (this._isSelected) {
        this._pulse();
    } else if (this._isActivated) {
        this._highlight();
    } else {
        this._unhighlight();
    }
    this._departureSelector.update(screenPosition, screenRadius);
    this._arrivalSelector.update(screenPosition, screenRadius);
};

gui.OrbitingBody.prototype.displayAtEpoch = function (epoch) {
    var orbSVs = this.orbitalStateVectorsAtEpoch(epoch);
    this._position = orbSVs.position;
    var newPos = new THREE.Vector3(this._position.getX(), this._position.getY(), this._position.getZ()).multiplyScalar(gui.POSITION_SCALE);
    this._bodyMesh.position = newPos;
    this._displayOrbitAtEpoch(epoch);
};

gui.OrbitingBody.prototype.getDefaultConfiguration = function (userAction) {
    this._getSelector().getDefaultConfiguration(userAction);
};

gui.OrbitingBody.prototype.reset = function () {
    this._vehicle = null;
    this._configurationStatus = core.ConfigurationStatus.DELIVERED;
    this._configurationMode = core.TransferLegConfigurationModes.ARRIVAL;
    this._surface.reset();
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