/* Class GameState. 
    Contains all informations about the current gamestate.
*/
core.GameState = function (orbitingBody, epoch, passedDays, totalDeltaV, score, spacecraft, velocityInf, mappedFaces, transferLeg) {
    this._orbitingBody = orbitingBody;
    this._transferLeg = transferLeg || {
        chromosome: [],
        deltaV: 0,
        timeOfFlight: 0,
        visualization: null,
        dsmRating: 1,
        mappedFaceID: '',
        problemType: null
    };
    this._epoch = epoch;
    this._passedDays = passedDays;
    this._score = score;
    this._totalDeltaV = totalDeltaV;
    this._velocityInf = velocityInf.clone();
    this._mappedFaces = {};
    for (var faceID in mappedFaces) {
        this._mappedFaces[faceID] = mappedFaces[faceID].clone();
    }
    this._isRoot = false;
    this._invalidReasonIDs = [];
    this._isWinning = false;
    this._spacecraft = spacecraft.clone();

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
        var leg = {
            chromosome: this._transferLeg.chromosome.clone(),
            timeOfFlight: this._transferLeg.timeOfFlight,
            deltaV: this._transferLeg.deltaV,
            visualization: this._transferLeg.visualization,
            dsmRating: this._transferLeg.dsmRating,
            mappedFaceID: this._transferLeg.mappedFaceID,
            problemType: this._transferLeg.problemType
        };
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

    getVelocityInf: function () {
        return this._velocityInf.clone();
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

    isRoot: function () {
        return this._isRoot;
    },

    getSpacecraft: function () {
        return this._spacecraft.clone();
    },

    markRoot: function () {
        this._isRoot = true;
    },

    markInvalid: function (invalidReasonIDs) {
        this._invalidReasonIDs.push.apply(this._invalidReasonIDs, invalidReasonIDs);
    },

    markWinning: function () {
        this._isWinning = true;
    }
};