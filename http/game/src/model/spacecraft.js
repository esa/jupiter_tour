/* Class Spacecraft
    Represents the Spacecraft currently used
*/
model.Spacecraft = function (mass, emptyMass, maxThrust, specificImpulse, totalDeltaV, isLanded) {
    this._mass = mass;
    this._emptyMass = emptyMass;
    this._maxThrust = maxThrust;
    this._specificImpulse = specificImpulse;
    this._totalDeltaV = (totalDeltaV != null ? totalDeltaV : Math.log(this._mass / this._emptyMass) * this._specificImpulse * constants.STANDARD_ACCELERATION);
    this._isLanded = (isLanded != null ? isLanded : false);
};

model.Spacecraft.prototype = {
    constructor: model.SpacecraftModel,

    getMass: function () {
        return this._mass;
    },

    getEmptyMass: function () {
        return this._emptyMass;
    },

    getMaxThrust: function () {
        return this._maxThrust;
    },

    isLanded: function () {
        return this._isLanded;
    },

    setLanded: function (isLanded) {
        this._isLanded = isLanded;
    },

    performManeuver: function (deltaV, timeOfFlight) {
        var maxDeltaV = this._maxThrust / this._mass * timeOfFlight;
        this._mass *= Math.exp(-(deltaV / (this._specificImpulse * constants.STANDARD_ACCELERATION)));
        var performance = 1 - deltaV / maxDeltaV;
        if (this._mass < this._emptyMass) {
            performance = null;
        }
        return performance;
    },

    getSpecificImpulse: function () {
        return this._specificImpulse;
    },

    getTotalDeltaV: function () {
        return this._totalDeltaV;
    },

    clone: function () {
        return new model.Spacecraft(this._mass, this._emptyMass, this._maxThrust, this._specificImpulse, this._totalDeltaV, this._isLanded);
    }
};