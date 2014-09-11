/* Class Stage
    Represents one stage of the Vehicle
*/
model.Stage = function (propulsionType, totalMass, emptyMass, remainingMass, thrust, specificImpulse) {
    this._propulsionType = propulsionType;
    this._totalMass = totalMass;
    this._remainingMass = remainingMass;
    this._emptyMass = emptyMass;
    this._thrust = thrust;
    this._specificImpulse = specificImpulse;
};

model.Stage.prototype = {
    constructor: model.StageModel,

    getPropulsionType: function () {
        return this._propulsionType;
    },

    getRemainingMass: function () {
        return this._remainingMass;
    },

    getTotalMass: function () {
        return this._totalMass;
    },

    getEmptyMass: function () {
        return this._emptyMass;
    },

    getThrust: function () {
        return this._thrust;
    },

    getSpecificImpulse: function () {
        return this._specificImpulse;
    },

    setRemainingMass: function (remainingMass) {
        this._remainingMass = remainingMass;
    },

    clone: function () {
        return new model.Stage(this._propulsionType, this._totalMass, this._emptyMass, this._remainingMass, this._thrust, this._specificImpulse);
    }
};