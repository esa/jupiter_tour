/* Namespace GUI 
    Contains all graphical stuff
*/
var gui = {};

(function () {
    var FIELD_OF_VIEW = 0.261799388;
    var POSITION_SCALE = 1e-7;
    var UNIVERSUM_SIZE = 1e5;

    var ScreenDirections = {
        LEFT: 0,
        RIGHT: 1,
        UP: 2,
        DOWN: 3
    };

    /* No object shall have this ID!*/
    var NULL_ID = 0;

    var idSeed = 0;

    function updateIDSeed(seed) {
        idSeed = Math.max(idSeed, seed);
    }

    function createID() {
        return idSeed++;
    }

    //Exposed Interface
    gui.NULL_ID = NULL_ID;
    gui.FIELD_OF_VIEW = FIELD_OF_VIEW;
    gui.POSITION_SCALE = POSITION_SCALE;
    gui.UNIVERSUM_SIZE = UNIVERSUM_SIZE;
    gui.ScreenDirections = ScreenDirections;
    gui.createID = createID;
    gui.updateIDSeed = updateIDSeed;
})();