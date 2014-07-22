/* Constant strings */
var strings = {};

(function () {

    var FinalStateReasonIDs = {
        MAX_MISSION_EPOCH: 0,
        MAX_FLYBY_SCORE: 1,
        MAX_TOTAL_DELTAV: 2,
        SPACECRAFT_LIMITATION: 3,
        MISSION_GOAL_ACHIEVED: 4,
    };

    // Continue number from above
    var GameErrors = {
        JDE_NO_SOLUTION: 5
    };

    // Continue number from above
    var GameInfos = {
        FACE_MAP_RESULT_OK: 6,
        FACE_MAP_RESULT_FAIL: 7,
        FACE_MAP_RESULT: 8,
        WELCOME: 9,
        FIND_ANOTHER_WAY: 10,
        FLYBY_RESULT: 11,
        SAME_BODY_FORBIDDEN: 12,
        SPACECRAFT_LANDING: 13,
        SPACECRAFT_LAUNCH: 14,
        SPACECRAFT_PARKED: 15,
        SPACECRAFT_ORBITING: 16,
        SPACECRAFT_JETTISON_STAGE: 17
    };

    var texts = {
        0: 'You reached the end of the allowed timeframe.',
        1: 'You mapped all faces.',
        2: 'Your spacecraft is out of fuel.',
        3: 'The spacecraft would not be able to perform the previous maneuver.',
        4: 'Mission goal accomplished! Well done.',
        5: 'JDE couldn\'t find a solution for the defined bounds.',
        6: 'You mapped your selected face %d successfully.',
        7: 'You selected face %d for mapping but the spacecraft\'s trajectory only allowed to map face %d.',
        8: 'Your last flyby mapped face %d on %s.',
        9: 'Welcome to space hopper!',
        10: 'Click here to get back and try another way.',
        11: 'Your last Flyby was at %s.',
        12: 'You can not select the same body at this point.',
        13: 'Your spacecraft landed on %s.',
        14: 'Your spacecraft launched from %s.',
        15: 'Your spacecraft is parked on %s.',
        16: 'Your spacecraft is on a flyby trajectory of %s.',
        17: 'Your vehicle successfully jettisoned stage %d.'
    };

    function toText(textID, fillIns) {
        var text = texts[textID];
        if (fillIns) {
            return vsprintf(text, fillIns);
        } else {
            return text;
        }
    }

    //Exposed Interface
    strings.FinalStateReasonIDs = FinalStateReasonIDs;
    strings.GameErrors = GameErrors;
    strings.GameInfos = GameInfos;
    strings.toText = toText;
})();