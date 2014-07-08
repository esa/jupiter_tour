/* Class Vehicle
    Represents a stageable spacecraft. 
*/
model.Vehicle = function (velocityInf, stages, isLanded, totalDeltaV) {
    this._velocityInf = velocityInf.clone();
    this._stages = [];
    this._isLanded = (isLanded != null ? isLanded : false);
    this._totalDeltaV = 0;
    var mass = 0;
    for (var i = 0; i < stages.length; i++) {
        this._stages.push(stages[i].clone())
        var fullMass = stages[i].getMass() + mass;
        var emptyMass = stages[i].getEmptyMass() + mass;
        this._totalDeltaV += Math.log(fullMass / emptyMass) * stages[i].getSpecificImpulse() * constants.STANDARD_ACCELERATION;
        mass += stages[i].getMass();
    }
    if (totalDeltaV != null) {
        this._totalDeltaV = totalDeltaV;
    }
};

model.Vehicle.prototype = {
    constructor: model.Vehicle,

    performManeuver: function (deltaV, timeOfFlight) {
        var dsmResult = {
            performance: 0,
            isOutOfFuel: false,
            hasDeltaVLimitation: false
        };
        var stage = this._stages[this._stages.length - 1];
        var maxDeltaV = stage.getThrust() / this.getMass() * timeOfFlight;
        var mass = stage.getMass() * Math.exp(-(deltaV / (stage.getSpecificImpulse() * constants.STANDARD_ACCELERATION)));
        stage.setMass(mass);

        dsmResult.performance = 1 - deltaV / maxDeltaV;

        if (stage.getMass() < stage.getEmptyMass()) {
            dsmResult.isOutOfFuel = true;
            dsmResult.performance = 0;
        }
        dsmResult.hasDeltaVLimitation = dsmResult.performance < 0;
        dsmResult.performance = Math.min(1, dsmResult.performance);

        return dsmResult;
    },

    jettisonStage: function () {
        this._stages.pop();
    },

    getMass: function () {
        var mass = 0;
        for (var i = 0; i < this._stages.length; i++) {
            mass += this._stages[i].getMass();
        }
        return mass;
    },

    isLanded: function () {
        return this._isLanded;
    },

    setLanded: function (landed) {
        this._isLanded = landed;
    },

    getDeltaV: function () {
        var mass = 0;
        var length = this._stages.length;
        for (var i = 0; i < length - 1; i++) {
            mass += this._stages[i].getMass();
        }
        var stage = this._stages[length - 1];
        return Math.log((stage.getMass() + mass) / (stage.getEmptyMass() + mass)) * stage.getSpecificImpulse() * constants.STANDARD_ACCELERATION;
    },

    getStages: function () {
        var stages = [];
        for (var i = 0; i < this._stages.length; i++) {
            stages.push(this._stages[i].clone());
        }
        return stages;
    },

    getTotalDeltaV: function () {
        return this._totalDeltaV;
    },

    getVelocityInf: function () {
        return this._velocityInf.clone();
    },

    setVelocityInf: function (velocityInf) {
        this._velocityInf = velocityInf.clone();
    },

    clone: function () {
        return new model.Vehicle(this._velocityInf, this._stages, this._isLanded, this._totalDeltaV);
    }
};