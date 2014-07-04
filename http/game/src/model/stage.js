/* Class Stage
    Represents one stage of the Vehicle
*/
model.Stage = function (propulsionType, mass, emptyMass, thrust, specificImpulse) {
    this._propulsionType = propulsionType;
    this._mass = mass;
    this._emptyMass = emptyMass;
    this._thrust = thrust;
    this._specificImpulse = specificImpulse;
};

model.Stage.prototype = {
    constructor: model.StageModel,

    getPropulsionType: function () {
        return this._propulsionType;
    },

    getMass: function () {
        return this._mass;
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

    setMass: function (mass) {
        this._mass = mass;
    },

    clone: function () {
        return new model.Stage(this._propulsionType, this._mass, this._emptyMass, this._thrust, this._specificImpulse);
    }
};