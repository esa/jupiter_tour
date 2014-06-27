/* 3x3 matrix class */
geometry.Matrix3 = function (el11, el12, el13, el21, el22, el23, el31, el32, el33) {
    this._elements = new Array(9);

    this.set(
        (el11 !== undefined) ? el11 : 1, el12 || 0, el13 || 0,
        el21 || 0, (el22 !== undefined) ? el22 : 1, el23 || 0,
        el31 || 0, el32 || 0, (el33 !== undefined) ? el33 : 1);
};

geometry.Matrix3.prototype = {
    constructor: geometry.Matrix3,

    getElements: function () {
        return this._elements.clone();
    },

    set: function (el11, el12, el13, el21, el22, el23, el31, el32, el33) {
        var elements = this._elements;
        elements[0] = el11;
        elements[1] = el12;
        elements[2] = el13;
        elements[3] = el21;
        elements[4] = el22;
        elements[5] = el23;
        elements[6] = el31;
        elements[7] = el32;
        elements[8] = el33;
        return this;
    }
};