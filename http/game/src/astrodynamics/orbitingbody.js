/* Class OrbitingBody
    Represents an orbiting body around the fixed central body.
    Inherits Satellite
*/
astrodynamics.OrbitingBody = function (id, name, centralBody, orbitalElements, orbitalElementDerivatives, refEpoch, sgp, radius, minRadiusFactor, maxRadiusFactor, maxTimeOfFlight, maxLaunchDelay, arrivalOption, interactionOption, surface) {
    astrodynamics.Satellite.call(this, centralBody, orbitalElements, orbitalElementDerivatives, refEpoch, sgp);
    this._id = id;
    this._name = name;
    this._radius = radius;
    this._minRadius = radius * minRadiusFactor;
    this._maxRadius = radius * maxRadiusFactor;
    this._maxTimeOfFlight = maxTimeOfFlight * utility.DAY_TO_SEC;
    this._maxLaunchDelay = maxLaunchDelay != null ? maxLaunchDelay * utility.DAY_TO_SEC : 0;
    this._arrivalOption = arrivalOption;
    this._interactionOption = interactionOption;
    this._surfaceType = surface.type;

    this._vehicle = null;

    this._surface = null;
    switch (this._surfaceType) {
    case model.SurfaceTypes.TRUNCATED_ICOSAHEDRON:
        this._surface = new model.TruncatedIcosahedronSurface(this, surface.values);
        break;
    case model.SurfaceTypes.SPHERE:
        this._surface = new model.SphericalSurface(this, surface.values);
        break;
    }

    var orbSVs = this.orbitalStateVectorsAtEpoch(this._refEpoch);
    this._position = orbSVs.position;
};
astrodynamics.OrbitingBody.prototype = Object.create(astrodynamics.Satellite.prototype);
astrodynamics.OrbitingBody.prototype.constructor = astrodynamics.OrbitingBody;

astrodynamics.OrbitingBody.prototype.getID = function () {
    return this._id;
};

astrodynamics.OrbitingBody.prototype.getName = function () {
    return this._name;
};

astrodynamics.OrbitingBody.prototype.getRadius = function () {
    return this._radius;
};

astrodynamics.OrbitingBody.prototype.getPosition = function () {
    return this._position.clone();
};

astrodynamics.OrbitingBody.prototype.getMinRadius = function () {
    return this._minRadius;
};

astrodynamics.OrbitingBody.prototype.getMaxRadius = function () {
    return this._maxRadius;
};

astrodynamics.OrbitingBody.prototype.getMaxTimeOfFlight = function () {
    return this._maxTimeOfFlight;
};

astrodynamics.OrbitingBody.prototype.getMaxLaunchDelay = function () {
    return this._maxLaunchDelay;
};

astrodynamics.OrbitingBody.prototype.getArrivalOption = function () {
    return this._arrivalOption;
};

astrodynamics.OrbitingBody.prototype.getInteractionOption = function () {
    return this._interactionOption;
};

astrodynamics.OrbitingBody.prototype.computeFlybyFaceAndCoords = function (epoch, velocityInf, beta, radius) {
    var periapsis = astrodynamics.computePeriapsis(this, epoch, velocityInf, beta, radius);
    return this._surface.computeFlybyFaceAndCoords(periapsis);
};

astrodynamics.OrbitingBody.prototype.setFlybyCoords = function (faceID, coords, isNewest) {
    this._surface.setFlybyCoords(faceID, coords, isNewest);
};

astrodynamics.OrbitingBody.prototype.getTotalSurfaceValue = function () {
    return this._surface.getTotalValue();
};

astrodynamics.OrbitingBody.prototype.isFaceVisited = function (faceID) {
    return this._surface.isFaceVisited(faceID);
};

astrodynamics.OrbitingBody.prototype.setFaceVisited = function (faceID, isVisited) {
    this._surface.setFaceVisited(faceID, isVisited);
};

astrodynamics.OrbitingBody.prototype.isNewestVisitCoords = function (faceID, coordsID) {
    return this._surface.isNewestVisitCoords(faceID, coordsID);
};

astrodynamics.OrbitingBody.prototype.setFaceSelected = function (faceID, isSelected) {
    this._surface.setFaceSelected(faceID, isSelected);
};

astrodynamics.OrbitingBody.prototype.isFaceVisitable = function (faceID) {
    return this._surface.isFaceVisitable(faceID);
};

astrodynamics.OrbitingBody.prototype.isFaceSelected = function (faceID) {
    return this._surface.isFaceSelected(faceID);
};

astrodynamics.OrbitingBody.prototype.getFaceBetaBounds = function (faceID) {
    return this._surface.getFaceBetaBounds(faceID);
};

astrodynamics.OrbitingBody.prototype.getFaceValue = function (faceID) {
    return this._surface.getFaceValue(faceID);
};

astrodynamics.OrbitingBody.prototype.getFaceRadiusBounds = function (faceID) {
    return this._surface.getFaceRadiusBounds(faceID);
};

astrodynamics.OrbitingBody.prototype.getSurfaceType = function () {
    return this._surfaceType;
};