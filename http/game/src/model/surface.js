/* Class Surface
    Abstraction of body surface
*/
model.Surface = function (orbitingBody) {
    this._orbitingBody = orbitingBody;
};
model.Surface.prototype = {
    constructor: model.Surface,

    updateFaces: function () {},

    reset: function () {},

    computeFlybyFaceAndCoords: function () {
        return {
            faceID: 0,
            coords: null
        };
    },

    getFaceValue: function () {
        return 0;
    },

    getTotalValue: function () {
        return 0;
    }
};