/* Namespace GUI 
    Contains all graphical stuff
*/
var gui = {
    FIELD_OF_VIEW: 0.261799388,

    POSITION_SCALE: 1 / 10000000,

    UNIVERSUM_SIZE: 1e5,

    ScreenDirections: {
        LEFT: 0,
        RIGHT: 1,
        UP: 2,
        DOWN: 3
    },

    /* No object shall have this ID!*/
    NULL_ID: 0
};

(function () {
    var idSeed = 0;

    function updateIDSeed(seed) {
        idSeed = Math.max(idSeed, seed);
    }

    function createID() {
        return idSeed++;
    }

    //Exposed Interface
    gui.createID = createID;
    gui.updateIDSeed = updateIDSeed;
})();