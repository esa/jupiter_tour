/* 2 dimensional Vector class */
geometry.Vector2 = function (valX, valY) {
    this._valX = valX || 0;
    this._valY = valY || 0;
};

geometry.Vector2.prototype = {
    constructor: geometry.Vector2,

    set: function (valX, valY) {
        this._valX = valX;
        this._valY = valY;
        return this;
    },

    getX: function () {
        return this._valX;
    },

    getY: function () {
        return this._valY;
    },

    toPolar: function () {
        var radius = this.normEuclid();
        var theta;

        if (this._valX == 0 && this._valY == 0) {
            theta = 0;
        } else if (this._valY >= 0) {
            theta = Math.acos(this._valX / radius);
        } else if (this._valY < 0) {
            theta = (2 * Math.PI) - Math.acos(this._valX / radius);
        }

        theta *= utility.RAD_TO_DEG;

        return {
            rad: radius,
            angle: theta
        };
    },

    sub: function (vector) {
        this._valX -= vector.getX();
        this._valY -= vector.getY();
        return this;
    },

    dot: function (vector) {
        return this._valX * vector.getX() + this._valY * vector.getY();
    },

    multiplyScalar: function (scalar) {
        this._valX *= scalar;
        this._valY *= scalar;
        return this;
    },

    dotMe: function () {
        return this._valX * this._valX + this._valY * this._valY;
    },

    normEuclid: function () {
        return Math.sqrt(this.dotMe());
    },

    fromArray: function (values) {
        var valX = values[0];
        var valY = values[1];
        this.set(valX, valY);
        return this;
    },

    asArray: function () {
        return [this._valX, this._valY];
    },

    clone: function () {
        return new geometry.Vector2(this._valX, this._valY);
    }
};