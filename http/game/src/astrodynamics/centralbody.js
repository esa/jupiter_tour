/* Class CentralBody
    The fixed central body in the world
 */
astrodynamics.CentralBody = function (id, name, sgp, radius) {
    this._id = id;
    this._name = name;
    this._radius = radius;
    this._sgp = sgp;
    this._position = new geometry.Vector3();
};
astrodynamics.CentralBody.prototype = {
    constructor: astrodynamics.CentralBody,

    getID: function () {
        return this._id;
    },

    getStandardGravitationalParameter: function () {
        return this._sgp;
    },

    getName: function () {
        return this._name;
    },

    getPosition: function () {
        return this._position.clone();
    },

    getRadius: function () {
        return this._radius;
    }
};