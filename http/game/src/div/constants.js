/* Namespace CONSTANTS
    Contains global constants
*/
var constants = {};

(function () {
    var ASTRONOMICAL_UNIT = 149597870660.0; // 1 Astronomical Unit [km]};
    var STANDARD_ACCELERATION = 9.80665; // standard acceleration due to gravity [m/s2]
    var GOLDEN_RATIO = 1.61803398875;


    //Exposed Interface
    constants.STANDARD_ACCELERATION = STANDARD_ACCELERATION;
    constants.ASTRONOMICAL_UNIT = ASTRONOMICAL_UNIT;
    constants.GOLDEN_RATIO = GOLDEN_RATIO;
})();