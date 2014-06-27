/* For Convenience */
Array.prototype.clone = function () {
    return this.slice(0);
};

Array.prototype.remove = function (pos) {
    this.splice(pos, 1);
    return this;
};

Array.prototype.sum = function () {
    var result = 0;
    for (var i = 0; i < this.length; i++) {
        result += this[i];
    }
    return result;
};

Array.prototype.min = function (funObjectiveValue) {
    var result = null;
    var min = Number.MAX_VALUE;
    for (var i = 0; i < this.length; i++) {
        var val = funObjectiveValue(this[i]);
        if (val < min) {
            result = this[i];
            min = val;
        }
    }
    return result;
};

Array.prototype.prettyPrint = function () {
    var result = '[';
    for (var i = 0; i < this.length - 1; i++) {
        result += this[i] + ', ';
    }
    if (this.length) {
        result += this[this.length - 1];
    }
    result += ']';
    return result;
};