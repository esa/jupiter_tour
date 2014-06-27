/* 3 dimensional Vector class */
geometry.Vector3 = function (valX, valY, valZ) {
    this._valX = valX || 0;
    this._valY = valY || 0;
    this._valZ = valZ || 0;
};

geometry.Vector3.prototype = {
    constructor: geometry.Vector3,

    set: function (valX, valY, valZ) {
        this._valX = valX;
        this._valY = valY;
        this._valZ = valZ;
        return this;
    },

    getX: function () {
        return this._valX;
    },

    getY: function () {
        return this._valY;
    },

    getZ: function () {
        return this._valZ;
    },

    add: function (vector) {
        this._valX += vector.getX();
        this._valY += vector.getY();
        this._valZ += vector.getZ();
        return this;
    },

    sub: function (vector) {
        this._valX -= vector.getX();
        this._valY -= vector.getY();
        this._valZ -= vector.getZ();
        return this;
    },

    dot: function (vector) {
        return this._valX * vector.getX() + this._valY * vector.getY() + this._valZ * vector.getZ();
    },

    dotMe: function () {
        return this._valX * this._valX + this._valY * this._valY + this._valZ * this._valZ;
    },

    normEuclid: function () {
        return Math.sqrt(this.dotMe());
    },

    multiply: function (vector) {
        this._valX *= vector.getX();
        this._valY *= vector.getY();
        this._valZ *= vector.getZ();
        return this;
    },

    multiplyScalar: function (scalar) {
        this._valX *= scalar;
        this._valY *= scalar;
        this._valZ *= scalar;
        return this;
    },

    divideScalar: function (scalar) {
        this._valX /= scalar;
        this._valY /= scalar;
        this._valZ /= scalar;
        return this;
    },

    normalize: function () {
        this.divideScalar(this.normEuclid());
        return this;
    },

    crossVectors: function (vectorA, vectorB) {
        var valAx = vectorA.getX(),
            valAy = vectorA.getY(),
            valAz = vectorA.getZ();
        var valBx = vectorB.getX(),
            valBy = vectorB.getY(),
            valBz = vectorB.getZ();
        this._valX = valAy * valBz - valAz * valBy;
        this._valY = valAz * valBx - valAx * valBz;
        this._valZ = valAx * valBy - valAy * valBx;
        return this;
    },

    applyMatrix3: function (matrix) {
        var valX = this._valX;
        var valY = this._valY;
        var valZ = this._valZ;

        var matrixElements = matrix.getElements();

        this._valX = matrixElements[0] * valX + matrixElements[1] * valY + matrixElements[2] * valZ;
        this._valY = matrixElements[3] * valX + matrixElements[4] * valY + matrixElements[5] * valZ;
        this._valZ = matrixElements[6] * valX + matrixElements[7] * valY + matrixElements[8] * valZ;
        return this;
    },

    clone: function () {
        return new geometry.Vector3(this._valX, this._valY, this._valZ);
    },

    fromArray: function (values) {
        var valX = values[0];
        var valY = values[1];
        var valZ = values[2];
        this.set(valX, valY, valZ);
        return this;
    },

    asArray: function () {
        return [this._valX, this._valY, this._valZ];
    },

    asTHREE: function () {
        return new THREE.Vector3(this._valX, this._valY, this._valZ);
    },

    toString: function (round) {
        if (arguments.length) {
            round = Math.pow(10, round);
            return '[' + Math.round(this._valX * round) / round + ',' + Math.round(this._valY * round) / round + ',' + Math.round(this._valZ * round) / round + ']';
        } else {
            return '[' + this._valX + ',' + this._valY + ',' + this._valZ + ']';
        }
    }
};