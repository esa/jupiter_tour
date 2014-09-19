/* Class Vehicle
    Represents a stageable spacecraft. 
*/
model.Vehicle = function (velocityInf, stages, isLanded) {
    this._velocityInf = velocityInf.clone();
    this._stages = [];
    this._isLanded = (isLanded != null ? isLanded : false);
    for (var i = 0; i < stages.length; i++) {
        this._stages.push(stages[i].clone());
    }
};

model.Vehicle.prototype = {
    constructor: model.Vehicle,

    performManeuver: function (deltaV, timeOfFlight) {
        var dsmResult = {
            gravityLoss: 0,
            isOutOfFuel: false,
            hasDeltaVLimitation: false
        };
        var stage = this._stages[this._stages.length - 1];
        var maxDeltaV = stage.getThrust() / this.getRemainingMass() * timeOfFlight;
        var mass = stage.getRemainingMass() * Math.exp(-(deltaV / (stage.getSpecificImpulse() * constants.STANDARD_ACCELERATION)));
        stage.setRemainingMass(mass);

        dsmResult.gravityLoss = 1 - deltaV / maxDeltaV;

        if (stage.getRemainingMass() < stage.getEmptyMass()) {
            dsmResult.isOutOfFuel = true;
            dsmResult.gravityLoss = 0;
        }
        dsmResult.hasDeltaVLimitation = dsmResult.gravityLoss < 0;
        return dsmResult;
    },

    jettisonStage: function () {
        this._stages.pop();
    },

    getRemainingMass: function (numStages) {
        var mass = 0;
        var length = numStages != null ? Math.min(numStages, this._stages.length) : this._stages.length;
        for (var i = 0; i < length; i++) {
            mass += this._stages[i].getRemainingMass();
        }
        return mass;
    },

    getTotalMass: function (numStages) {
        var mass = 0;
        var length = numStages != null ? Math.min(numStages, this._stages.length) : this._stages.length;
        for (var i = 0; i < length; i++) {
            mass += this._stages[i].getTotalMass();
        }
        return mass;
    },

    isLanded: function () {
        return this._isLanded;
    },

    setLanded: function (landed) {
        this._isLanded = landed;
    },

    getRemainingDeltaV: function (numStages) {
        var mass = 0;
        var remainingDeltaV = 0;
        var length = numStages != null ? Math.min(numStages, this._stages.length) : this._stages.length;
        for (var i = 0; i < length; i++) {
            var remainingMass = this._stages[i].getRemainingMass() + mass;
            var emptyMass = this._stages[i].getEmptyMass() + mass;
            remainingDeltaV += Math.log(remainingMass / emptyMass) * this._stages[i].getSpecificImpulse() * constants.STANDARD_ACCELERATION;
            mass += this._stages[i].getRemainingMass();
        }
        return remainingDeltaV;
    },

    getRemainingDeltaVForStage: function (numStage) {
        var mass = 0;
        var upToStage = numStage != null ? Math.min(numStage, this._stages.length) : this._stages.length - 1;
        for (var i = 0; i < upToStage; i++) {
            mass += this._stages[i].getRemainingMass();
        }
        var remainingMass = this._stages[upToStage].getRemainingMass() + mass;
        var emptyMass = this._stages[upToStage].getEmptyMass() + mass;
        return Math.log(remainingMass / emptyMass) * this._stages[i].getSpecificImpulse() * constants.STANDARD_ACCELERATION;
    },

    getTotalDeltaV: function (numStages) {
        var mass = 0;
        var totalDeltaV = 0;
        var length = numStages != null ? Math.min(numStages, this._stages.length) : this._stages.length;
        for (var i = 0; i < length; i++) {
            var fullMass = this._stages[i].getTotalMass() + mass;
            var emptyMass = this._stages[i].getEmptyMass() + mass;
            totalDeltaV += Math.log(fullMass / emptyMass) * this._stages[i].getSpecificImpulse() * constants.STANDARD_ACCELERATION;
            mass += this._stages[i].getTotalMass();
        }
        return totalDeltaV;
    },

    getStages: function () {
        var stages = [];
        for (var i = 0; i < this._stages.length; i++) {
            stages.push(this._stages[i].clone());
        }
        return stages;
    },

    getVelocityInf: function () {
        return this._velocityInf.clone();
    },

    setVelocityInf: function (velocityInf) {
        this._velocityInf = velocityInf.clone();
    },

    clone: function () {
        return new model.Vehicle(this._velocityInf, this._stages, this._isLanded);
    }
};