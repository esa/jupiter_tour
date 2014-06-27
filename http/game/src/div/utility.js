/* Namespace UTILITY
    Add functions that are for convenience here.
*/
var utility = {
    JULIAN_CENTURY_TO_DAY: 36525.0,
    DAY_TO_SEC: 86400.0,
    SEC_TO_DAY: 1 / 86400.0,
    YEAR_TO_DAY: 365.25,
    RAD_TO_DEG: 180.0 / Math.PI,
    DEG_TO_RAD: Math.PI / 180.0,
    MOUSE_WHEEL_EVENT: (/Firefox/i.test(navigator.userAgent)) ? 'DOMMouseScroll' : 'mousewheel'
};

utility.toPixelString = function (value, round) {
    if (round) {
        return (Math.round(value / 10) * 10).toString() + 'px';
    } else {
        return Math.round(value).toString() + 'px';
    }
};

utility.parseTransform = function (transformText) {
    var result = {
        translation: [0, 0],
        scale: 1
    };

    if (!transformText) {
        return result;
    }

    var transformCopy = transformText;

    var result = {
        translation: [0, 0],
        scale: 0
    };

    if (transformText.indexOf('translate(') > -1) {
        transformText = transformText.substring(transformText.indexOf('translate(') + 10);
        transformText = transformText.substring(0, transformText.indexOf(')'));
        var translation = transformText.split(',').map(function (value) {
            return parseFloat(value);
        });
        result.translation = translation;
    }

    if (transformCopy.indexOf('scale(') > -1) {
        transformCopy = transformCopy.substring(transformCopy.indexOf('scale(') + 6);
        transformCopy = transformCopy.substring(0, transformCopy.indexOf(')'));
        result.scale = parseFloat(transformCopy);
    }

    return result;
};

utility.randZ = function (min, max) {
    return Math.round(Math.random() * max) + min;
};

utility.randR = function (min, max) {
    return Math.random() * (max - min) + min;
};

utility.sampleU = function (min, max, num) {
    var samples = [];
    for (var i = 0; i < num; i++) {
        samples.push(utility.randZ(min, max));
    }
    return samples;
};

utility.cartToFlat = function (cartesianCoords) {
    var longitude = Math.atan2(cartesianCoords.getY(), cartesianCoords.getX());
    var latitude = Math.atan(cartesianCoords.getZ() / Math.sqrt(Math.pow(cartesianCoords.getX(), 2) + Math.pow(cartesianCoords.getY(), 2)));
    return new geometry.Vector2(longitude, latitude);
};

utility.fitText = function () {
    $('.text-fit').fitText();
};

utility.round = function (value, commaDigits) {
    if (arguments.length > 1) {
        commaDigits = Math.pow(10, commaDigits);
        return Math.round(value * commaDigits) / commaDigits;
    } else {
        return Math.round(value * 100) / 100;
    }
};

utility.clone = function (object) {
    return jQuery.extend(true, {}, object);
};