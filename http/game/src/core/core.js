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
        GAME_HISTORY_CHANGE: 9,
        MISSION_REVISION_AVAILABLE: 10,
        MISSION_REVISION_CHANGE: 11,
        AUTOSAVE_SUCCESS: 12
    };

    var TransferLegConfigurationModes = {
        DEPARTURE: 0,
        ARRIVAL: 1,
    };

    var ConfigurationStatus = {
        PENDING: 0,
        CONFIRMED: 1,
        CANCELED: 2,
        DELIVERED: 3
    };

    var VehicleArrivalOptions = {
        PERFORM_FLYBY: 0,
        PERFORM_LANDING: 1,
        DEFAULT_IS_FLYBY: 2,
        DEFAULT_IS_LANDING: 3
    };

    var BodyInteractionOptions = {
        NO_ACTION: 0,
        REMOVE_ON_FLYBY: 1,
        REMOVE_ON_LAUNCH: 2
    };

    //Exposed Interface
    core.GameStatePhases = GameStatePhases;
    core.GameEvents = GameEvents;
    core.TransferLegConfigurationModes = TransferLegConfigurationModes;
    core.ConfigurationStatus = ConfigurationStatus;
    core.VehicleArrivalOptions = VehicleArrivalOptions;
    core.BodyInteractionOptions = BodyInteractionOptions;
})();