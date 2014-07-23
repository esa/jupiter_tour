/* Namespace CORE 
    Contains all Functions and Classes which glue the system together.
    Append to it. */
var core = {};

/* Enumeration of gamephases */
(function () {

    var GameStatePhases = {
        ORBITING_BODY_OVERVIEW: 0,
        ORBITING_BODY_OVERVIEW_LOCKED: 1,
        TRANSFER_CONFIGURATION_NEXT_BODY: 2,
        TRANSFER_CONFIGURATION_CURRENT_BODY: 3,
        PROBLEM_PREPARATION: 4,
        PROBLEM_SOLVING: 5
    };

    var TransferLegConfigurationModes = {
        DEPARTURE: 0,
        ARRIVAL: 1,
    };

    var GameEvents = {
        GAME_STATE_CHANGE: 0,
        GAME_PHASE_CHANGE: 1,
        GAME_HISTORY_REQUEST: 2,
        SETUP_GAME: 3,
        GAME_ID_CHANGE: 4,
        GAME_ID_AVAILABLE: 5,
        MISSION_ID_AVAILABLE: 6,
        ENGINE_INITIALIZED: 7,
        ORBITING_BODIES_MAPPING_REQUEST: 8,
        GAME_HISTORY_CHANGE: 9
    };

    //Exposed Interface
    core.GameStatePhases = GameStatePhases;
    core.GameEvents = GameEvents;
    core.TransferLegConfigurationModes = TransferLegConfigurationModes;
})();