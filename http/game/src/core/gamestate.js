/* Class GameState. 
    Contains all informations about the current gamestate.
*/
core.GameState = function (orbitingBody, epoch, passedDays, totalDeltaV, score, vehicle, mappedFaces, transferLeg) {
    this._orbitingBody = orbitingBody;
    this._transferLeg = transferLeg;
    this._epoch = epoch;
    this._passedDays = passedDays;
    this._score = score;
    this._totalDeltaV = totalDeltaV;
    this._mappedFaces = {};
    for (var faceID in mappedFaces) {
        this._mappedFaces[faceID] = mappedFaces[faceID].clone();
    }
    this._invalidReasonIDs = [];
    this._isWinning = false;
    this._vehicle = vehicle.clone();

    if (transferLeg && transferLeg.periapsisCoords) {
        if (this._mappedFaces[this._transferLeg.mappedFaceID]) {
            this._mappedFaces[this._transferLeg.mappedFaceID].push(transferLeg.periapsisCoords.clone());
        } else {
            this._mappedFaces[this._transferLeg.mappedFaceID] = [transferLeg.periapsisCoords.clone()];
        }
    }
};
core.GameState.prototype = {
    constructor: core.GameState,

    getOrbitingBody: function () {
        return this._orbitingBody;
    },

    getTransferLeg: function () {
        var leg = null;
        if (this._transferLeg) {
            leg = {
                chromosome: this._transferLeg.chromosome.clone(),
                timeOfFlight: this._transferLeg.timeOfFlight,
                deltaV: this._transferLeg.deltaV,
                visualization: this._transferLeg.visualization,
                gravityLoss: this._transferLeg.gravityLoss,
                mappedFaceID: this._transferLeg.mappedFaceID,
                problemType: this._transferLeg.problemType
            };
        }
        return leg;
    },

    getPassedDays: function () {
        return this._passedDays;
    },

    getEpoch: function () {
        return this._epoch;
    },

    getScore: function () {
        return this._score;
    },

    getTotalDeltaV: function () {
        return this._totalDeltaV;
    },

    getMappedFaces: function () {
        var mappedFaces = {};
        for (var faceID in this._mappedFaces) {
            mappedFaces[faceID] = this._mappedFaces[faceID].clone();
        }
        return mappedFaces;
    },

    isInvalid: function () {
        return this._invalidReasonIDs.length > 0;
    },

    isWinning: function () {
        return this._isWinning;
    },

    getInvalidReasonIDs: function () {
        return this._invalidReasonIDs.clone();
    },

    getVehicle: function () {
        return this._vehicle.clone();
    },

    markInvalid: function (invalidReasonIDs) {
        this._invalidReasonIDs.push.apply(this._invalidReasonIDs, invalidReasonIDs);
    },

    markWinning: function () {
        this._isWinning = true;
    },

    setScore: function (score) {
        this._score = score;
    }
};