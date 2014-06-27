/* Namespace CORE 
    Contains all Functions and Classes which glue the system together.
    Append to it. */
var core = {};

/* Enumeration of gamephases */
(function () {

    var GameStatePhases = {
        ORBITING_BODY_OVERVIEW: 0,
        ORBITING_BODY_SELECTION: 1,
        ORBITING_BODY_FLYBY_CONFIGURATION: 2,
        SOLVING: 3,
        ORBITING_BODY_OVERVIEW_LOCKED: 4,
        LAUNCH_CONFIGURATION: 5
    };

    var GameEvents = {
        GAME_STATE_CHANGE: 'GAME_STATE_CHANGE',
        GAME_PHASE_CHANGE: 'GAME_PHASE_CHANGE',
        GAME_HISTORY_REQUEST: 'GAME_HISTORY_REQUEST',
        SETUP_GAME: 'SETUP_GAME',
        GAME_ID_CHANGE: 'GAME_ID_CHANGE',
        GAME_ID_AVAILABLE: 'GAME_ID_AVAILABLE',
        MISSION_ID_AVAILABLE: 'MISSION_ID_AVAILABLE',
        ENGINE_INITIALIZED: 'ENGINE_INITIALIZED',
        ORBITING_BODIES_MAPPING_REQUEST: 'ORBITING_BODIES_MAPPING_REQUEST'
    };

    //Exposed Interface
    core.GameStatePhases = GameStatePhases;
    core.GameEvents = GameEvents;
})();