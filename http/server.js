/* HTTP-Server for the space hopper game.
    Includes session-management, data retreival and user authorization.
    
    Requires:
        express
        http
        https
        node-fs
        mime
        body-parser
        ejs
        common-node
        mongodb
        crypto
        randomstring
        escape-html
        url
        vm
*/

var express = require('express');
var https = require('https');
var http = require('http');
var mime = require('mime');
var fs = require('fs');
var bodyparser = require('body-parser');
var ejs = require('ejs');
var cookieparser = require('cookie-parser');
var mongodb = require('mongodb');
var crypto = require('crypto');
var randomstring = require('randomstring');
var escape = require('escape-html');
var url = require('url');
var vm = require('vm');

// Acts 'like' a C #include statement
var include = function (path) {
    var code = fs.readFileSync(path);
    vm.runInThisContext(code, path);
}.bind(this);

// Include requried spacehopper framework parts
include(__dirname + '/game/src/div/constants.js');
include(__dirname + '/game/src/div/math.js');
include(__dirname + '/game/src/div/array.js');
include(__dirname + '/game/src/div/utility.js');
include(__dirname + '/game/src/div/strings.js');
include(__dirname + '/game/src/datastructure/datastructure.js');
include(__dirname + '/game/src/datastructure/treenode.js');
include(__dirname + '/game/src/datastructure/queue.js');
include(__dirname + '/game/src/datastructure/individual.js');
include(__dirname + '/game/src/datastructure/jdeproblem.js');
include(__dirname + '/game/src/geometry/geometry.js');
include(__dirname + '/game/src/geometry/vector2.js');
include(__dirname + '/game/src/geometry/vector3.js');
include(__dirname + '/game/src/geometry/matrix3.js');
include(__dirname + '/game/src/algorithm/algorithm.js');
include(__dirname + '/game/src/algorithm/newtonraphson.js');
include(__dirname + '/game/src/algorithm/regulafalsi.js');
include(__dirname + '/game/src/algorithm/bfs.js');
include(__dirname + '/game/src/astrodynamics/astrodynamics.js');
include(__dirname + '/game/src/astrodynamics/keplerequations.js');
include(__dirname + '/game/src/astrodynamics/lambert.js');
include(__dirname + '/game/src/astrodynamics/propagatelagrangian.js');
include(__dirname + '/game/src/astrodynamics/satellite.js');
include(__dirname + '/game/src/astrodynamics/centralbody.js');
include(__dirname + '/game/src/astrodynamics/flybypropagation.js');
include(__dirname + '/game/src/astrodynamics/periapsis.js');
include(__dirname + '/game/src/astrodynamics/orbitingbody.js');
include(__dirname + '/game/src/astrodynamics/launchleg.js');
include(__dirname + '/game/src/astrodynamics/flybyleg.js');
include(__dirname + '/game/src/astrodynamics/mga1dsmlaunch.js');
include(__dirname + '/game/src/astrodynamics/mga1dsmflyby.js');
include(__dirname + '/game/src/model/model.js');
include(__dirname + '/game/src/model/stage.js');
include(__dirname + '/game/src/model/vehicle.js');
include(__dirname + '/game/src/model/surface.js');
include(__dirname + '/game/src/model/sphericalsurface.js');
include(__dirname + '/game/src/model/truncatedicosahedronsurface.js');
include(__dirname + '/game/src/gui/gui.js');
include(__dirname + '/game/src/gui/stage.js');
include(__dirname + '/game/src/gui/vehicle.js');
include(__dirname + '/game/src/core/core.js');
include(__dirname + '/game/src/core/gamestate.js');
include(__dirname + '/game/src/core/historynode.js');

// Convenient stuff
(function () {
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
})();

// Extend namespace UTILITY
(function () {
    utility.clone = function (obj) {
        if (obj == null || typeof (obj) != 'object') {
            if (typeof (obj) == 'array') {
                return obj.clone();
            } else {
                return obj;
            }
        }
        var temp = obj.constructor();
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                temp[key] = utility.clone(obj[key]);
            }
        }
        return temp;
    };

    utility.merge = function (obj1, obj2) {
        var result = {};
        if (obj1 != null) {
            for (var key in obj1) {
                result[key] = obj1[key];
            }
        }
        if (obj2 != null) {
            for (var key in obj2) {
                result[key] = obj2[key];
            }
        }
        return result;
    };


    utility.isParetoDominant = function (score1, score2) {
        if (score1.score > score2.score) {
            return true;
        } else if (score1.score == score2.score) {
            if (score1.totalDeltaV < score2.totalDeltaV) {
                return true;
            } else if (score1.totalDeltaV == score2.totalDeltaV) {
                if (score1.passedDays < score2.passedDays) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    };
})();

// SPACEHOPPER namespace
var spacehopper = {};
(function () {
    spacehopper.SaveGameParser = function (missionPath, missionID, saveGame, deltaSaveGame) {
        this._missionID = missionID;
        this._saveGameNodeHistory = (saveGame != null ? saveGame.nodeHistory.clone() : null);
        this._deltaSaveGameNodeHistory = (deltaSaveGame != null ? deltaSaveGame.nodeHistory.clone() : null);
        this._saveGameSize = (saveGame != null ? saveGame.nodeHistory.length : 0);
        this._nodes = utility.clone((saveGame != null && deltaSaveGame != null ? utility.merge(deltaSaveGame.nodes, saveGame.nodes) : (saveGame == null ? deltaSaveGame.nodes : saveGame.nodes)));
        this._jumpTable = {};

        var mission = null;
        var saveGame = null;
        var localPath = missionPath + missionID + '.json';
        if (fs.existsSync(localPath)) {
            var jsonData = JSON.parse(fs.readFileSync(localPath));
            mission = jsonData.mission;
            saveGame = jsonData.saveGame;
        } else {
            throw Error(localPath + ' does not exist.');
        }

        this._mission = {};
        this._startSaveGame = saveGame;

        this._mission.centralBody = new astrodynamics.CentralBody(mission.centralBody.id, mission.centralBody.name, mission.centralBody.sgp, mission.centralBody.radius);


        this._mission.orbitingBodies = {};
        for (var currentBodyID in mission.orbitingBodies) {
            var id = parseInt(currentBodyID);
            var orbitingBodyData = mission.orbitingBodies[currentBodyID];
            var orbitalElements = orbitingBodyData.orbitalElements;
            var orbitalElementDerivatives = orbitingBodyData.orbitalElementDerivatives;

            var orbitingBody = new astrodynamics.OrbitingBody(id, orbitingBodyData.name, this._mission.centralBody, orbitalElements, orbitalElementDerivatives, orbitingBodyData.refEpoch, orbitingBodyData.sgp, orbitingBodyData.radius, orbitingBodyData.minRadiusFactor, orbitingBodyData.maxRadiusFactor, orbitingBodyData.maxTimeOfFlight, orbitingBodyData.maxLaunchDelay, orbitingBodyData.arrivalOption, orbitingBodyData.interactionOption, orbitingBodyData.surface);

            this._mission.orbitingBodies[orbitingBody.getID()] = orbitingBody;
        }

        this._mission.funGetInvalidReasonsForState = mission.funGetInvalidReasonsForState != null ? Function('gameState', mission.funGetInvalidReasonsForState) : null;
        this._mission.funIsWinningState = mission.funIsWinningState != null ? Function('gameState', mission.funIsWinningState) : null;
        this._mission.funSetScoreForState = mission.funSetScoreForState != null ? Function('gameState', mission.funSetScoreForState) : null;
        var maximumMissionDuration = mission.maximumMissionDuration;
        this._mission.funGetTimeUsage = function (gameState) {
            return 1 - gameState.getPassedTimeOfFlight() / maximumMissionDuration;
        };
        this._mission.funGetWinningProgress = Function('gameState', mission.funGetWinningProgress);
    };

    spacehopper.SaveGameParser.prototype = {
        constructor: spacehopper.SaveGameParser,

        _markAndSetScoreForGameState: function (parentGameState, gameState, dsmResult) {
            var reasonIDs = [];
            if (this._mission.funGetTimeUsage(gameState) >= 0) {
                reasonIDs.push(strings.FinalStateReasonIDs.MAX_MISSION_EPOCH);
            }
            if (this._mission.funGetInvalidReasonsForState) {
                reasonIDs.append(this._mission.funGetInvalidReasonsForState(gameState));
            }
            if (dsmResult) {
                if (dsmResult.hasDeltaVLimitation) {
                    reasonIDs.push(strings.FinalStateReasonIDs.SPACECRAFT_LIMITATION);
                }
                if (dsmResult.isOutOfFuel) {
                    reasonIDs.push(strings.FinalStateReasonIDs.MAX_TOTAL_DELTAV);
                }
            }
            if (reasonIDs.length) {
                gameState.markInvalid(reasonIDs);
            }
            if (this._mission.funIsWinningState) {
                if (!gameState.isInvalid()) {
                    if (this._mission.funIsWinningState(gameState)) {
                        gameState.markWinning();
                    }
                }
            }

            if (gameState.isInvalid()) {
                if (parentGameState) {
                    gameState.setScore(parentGameState.getScore());
                } else {
                    gameState.setScore(0);
                }
            } else {
                if (this._mission.funSetScoreForState) {
                    this._mission.funSetScoreForState(gameState);
                }
            }
        },

        _createGameState: function (parentNode, node) {
            var gameState = null;
            if (parentNode != null) {
                var parentGameState = parentNode.getValue();
                var parentBodies = parentGameState.getOrbitingBodies();
                var gameStateData = node.gameState;
                var currentBody = parentBodies[gameStateData.orbitingBodyID];
                if (currentBody) {
                    var chromosome = gameStateData.transferLeg.chromosome;
                    var problemType = gameStateData.transferLeg.problemType;
                    var performLanding = gameStateData.transferLeg.performLanding;
                    var mappedFaces = parentGameState.getMappedFaces();

                    var parentBody = parentGameState.getOrbitingBody();
                    var parentVehicle = parentGameState.getVehicle();
                    var parentScore = parentGameState.getScore();
                    var parentEpoch = parentGameState.getEpoch();
                    var parentPassedDays = parentGameState.getPassedDays();
                    var parentPassedTimeOfFlight = parentGameState.getPassedTimeOfFlight();
                    var parentTotalDeltaV = parentGameState.getTotalDeltaV();
                    var parentVelocityInf = parentVehicle.getVelocityInf();
                    var interactionOption = parentBody.getInteractionOption();

                    if ((parentBody.getInteractionOption() != core.BodyInteractionOptions.NO_ACTION) && (parentBody.getID() == currentBody.getID())) {
                        return gameState;
                    }

                    switch (currentBody.getArrivalOption()) {
                    case core.VehicleArrivalOptions.PERFORM_FLYBY:
                        if (performLanding) {
                            return gameState;
                        }
                        break;

                    case core.VehicleArrivalOptions.PERFORM_LANDING:
                        if (!performLanding) {
                            return gameState;
                        }
                        break;
                    }

                    var leg = null;
                    var flybyResult = null;
                    var faceValue = 0;
                    var timeOfFlight = 0;
                    var passedDays = parentPassedDays;
                    var passedTimeOfFlight = parentPassedTimeOfFlight;
                    var epoch = parentEpoch;
                    var deltaV = 0;
                    switch (problemType) {
                    case astrodynamics.ProblemTypes.MGA1DSM_LAUNCH_STANDBY:
                        if (!parentVehicle.isLanded()) {
                            return gameState;
                        }
                        epoch = chromosome[0];
                        passedDays += epoch - parentEpoch;
                        if (parentNode.getKey() != this._rootNode.getKey()) {
                            timeOfFlight = passedDays;
                            passedTimeOfFlight += timeOfFlight;
                        }
                        break;
                    case astrodynamics.ProblemTypes.MGA1DSM_LAUNCH:
                        if (!parentVehicle.isLanded()) {
                            return gameState;
                        }
                        leg = new astrodynamics.LaunchLeg(chromosome, parentBody, currentBody);
                        flybyResult = parentBody.computeFlybyFaceAndCoords(parentEpoch, parentVelocityInf, chromosome[1], chromosome[2]);
                        faceValue = parentBody.getFaceValue(flybyResult.faceID);
                        if (interactionOption == core.BodyInteractionOptions.REMOVE_ON_LAUNCH) {
                            delete parentBodies[parentBody.getID()];
                        }
                        timeOfFlight = chromosome[5];
                        epoch += timeOfFlight;
                        passedTimeOfFlight += timeOfFlight;
                        passedDays += timeOfFlight;
                        var problem = new astrodynamics.MGA1DSMLaunch(parentBody, currentBody, [0, 0], [0, 0], [0, 0], performLanding);
                        deltaV = problem.objectiveFunction(new datastructure.Individual(problem, chromosome));
                        break;
                    case astrodynamics.ProblemTypes.MGA1DSM_FLYBY:
                        if (parentVehicle.isLanded()) {
                            return gameState;
                        }
                        leg = new astrodynamics.FlybyLeg(chromosome, parentBody, currentBody, parentVelocityInf, parentEpoch);
                        flybyResult = parentBody.computeFlybyFaceAndCoords(parentEpoch, parentVelocityInf, chromosome[0], chromosome[1]);
                        faceValue = parentBody.getFaceValue(flybyResult.faceID);
                        if (interactionOption == core.BodyInteractionOptions.REMOVE_ON_FLYBY) {
                            delete parentBodies[parentBody.getID()];
                        }
                        timeOfFlight = chromosome[3];
                        passedTimeOfFlight += timeOfFlight;
                        passedDays += timeOfFlight;
                        var problem = new astrodynamics.MGA1DSMFlyby(parentBody, currentBody, epoch, parentVelocityInf, [0, 0], [0, 0], [0, 0], performLanding);
                        deltaV = problem.objectiveFunction(new datastructure.Individual(problem, chromosome));
                        epoch += timeOfFlight;
                        break;
                    }

                    var numStages = parentVehicle.getStages().length;
                    if (numStages > 1 && problemType == astrodynamics.ProblemTypes.MGA1DSM_LAUNCH) {
                        parentVehicle.jettisonStage();
                    }
                    var dsmResult = parentVehicle.performManeuver(deltaV, timeOfFlight * utility.DAY_TO_SEC);
                    var vehicle = parentVehicle.clone();
                    if (leg) {
                        var nextVelocityInf = leg.getArrivalVelocityInf();
                        vehicle.setVelocityInf(nextVelocityInf);
                        vehicle.setLanded(performLanding);
                    }

                    var score = parentScore + faceValue;
                    var totalDeltaV = parentTotalDeltaV + deltaV;

                    var transferLeg = {
                        problemType: problemType,
                        chromosome: chromosome,
                        deltaV: deltaV,
                        passedDays: passedDays - parentPassedDays,
                        visualization: leg,
                        gravityLoss: dsmResult ? dsmResult.gravityLoss : 1,
                        mappedFaceID: flybyResult != null ? parentBody.getID() + '_' + flybyResult.faceID : '',
                        periapsisCoords: flybyResult != null ? flybyResult.coords : null
                    };

                    gameState = new core.GameState(parentBodies, currentBody, epoch, passedDays, totalDeltaV, score, vehicle, mappedFaces, transferLeg, passedTimeOfFlight);
                    this._markAndSetScoreForGameState(parentGameState, gameState, dsmResult);
                }
            }
            return gameState;
        },

        _getRootNode: function () {
            var rootNode = this._startSaveGame.nodes[this._startSaveGame.nodeHistory[0]];
            var gameStateData = rootNode.gameState;
            var currentBody = this._mission.orbitingBodies[gameStateData.orbitingBodyID];
            var chromosome = null;
            var epoch = gameStateData.epoch;
            var passedDays = 0;
            var passedTimeOfFlight = 0;
            var totalDeltaV = 0;
            var velocityInf = new geometry.Vector3().fromArray(gameStateData.vehicle.velocityInf);
            var stages = [];
            var vehicleData = gameStateData.vehicle;
            for (var i = 0; i < vehicleData.stages.length; i++) {
                var stage = vehicleData.stages[i];
                stages.push(new gui.Stage(stage.propulsionType, stage.mass, stage.emptyMass, stage.remainingMass, stage.thrust, stage.specificImpulse, stage.imageURL));
            }
            var vehicle = new gui.Vehicle(velocityInf, stages, gameStateData.vehicle.isLanded);
            var dsmResult = null;
            var transferLeg = null;
            var score = 0;
            var mappedFaces = {};

            var gameState = new core.GameState(this._mission.orbitingBodies, currentBody, epoch, passedDays, totalDeltaV, score, vehicle, mappedFaces, transferLeg, passedTimeOfFlight);
            this._markAndSetScoreForGameState(null, gameState, dsmResult);

            var rootHistoryNode = new core.HistoryNode(gameState, rootNode.id, false);
            rootHistoryNode.setHistorySequenceNr(0);
            var id = rootHistoryNode.getKey();
            this._jumpTable[id] = rootHistoryNode;
            this._rootNode = rootHistoryNode;
            return rootHistoryNode;
        },

        _getNode: function (id) {
            if (this._jumpTable[id]) {
                return this._jumpTable[id];
            } else {
                var childNode = null;
                var node = this._nodes[id];
                var parentNode = this._getNode(node.parentID);
                var gameState = this._createGameState(parentNode, node);
                if (gameState) {
                    if (node.isVirtual) {
                        if (!parentNode.isVirtual() && parentNode.getValue().getVehicle().isLanded() && gameState.getTransferLeg().problemType == null) {
                            childNode = parentNode.addChild(gameState, id, true);
                        }
                    } else {
                        childNode = parentNode.addChild(gameState, id, false);
                    }
                    this._jumpTable[childNode.getKey()] = childNode;
                }
                return childNode;
            }
        },

        extractCheckedSaveGame: function (isDelta) {
            var rootNode = this._getRootNode();

            var newNodes = {};
            var newNodeHistory = [];
            var newNodeHistoryLength = 0;
            if (isDelta) {
                newNodeHistoryLength = this._saveGameSize;
            } else {
                newNodes[rootNode.getKey()] = rootNode;
                newNodeHistory.push(rootNode.getKey());
                newNodeHistoryLength = 1;
            }

            for (var i = (isDelta == true ? 0 : 1); i < this._deltaSaveGameNodeHistory.length; i++) {
                var id = this._deltaSaveGameNodeHistory[i];
                var node = this._getNode(id);
                if (node) {
                    if (node.getKey() != id) {
                        log('ERROR: Key mismatch.');
                    }
                    node.setHistorySequenceNr(newNodeHistoryLength);
                    newNodes[node.getKey()] = node;
                    newNodeHistory.push(node.getKey());
                    newNodeHistoryLength++;
                }
            }

            return {
                nodes: newNodes,
                nodeHistory: newNodeHistory
            };
        },

        // only call with checked savegame data!
        getMaximumScore: function () {
            var maxScore = {
                score: 0,
                totalDeltaV: 0,
                passedDays: 0
            };

            this._getRootNode();
            for (var i = 0; i < this._saveGameNodeHistory.length; i++) {
                var id = this._saveGameNodeHistory[i];
                var node = this._getNode(id);
                var gameState = node.getValue();
                var score = gameState.getScore();
                var totalDeltaV = gameState.getTotalDeltaV();
                var passedDays = gameState.getPassedDays();
                var curScore = {
                    score: score,
                    totalDeltaV: totalDeltaV,
                    passedDays: passedDays
                };
                if (utility.isParetoDominant(curScore, maxScore)) {
                    maxScore = curScore;
                }
            }
            return maxScore;
        }
    };
})();

// SERVER namespace
var Server = {};
(function () {

    // Server Configuration
    var SESSION_TIMEOUT = 30 * 60;
    var VERBOSE = true;
    var PORT = 8080;
    var ENABLE_HTTPS = false;
    var SESSION_ID_LENGTH = 48;
    var SESSION_CLEANING_INTERVAL = 30 * 60;
    var SCOREBOARD_REFRESH_INTERVAL = 10 * 60;
    var FILE_CACHING_TIME = 0 * 24 * 60 * 60;
    var DATABASE_NAME = 'spacehopper';
    var SPACE_HOPPER_ROOT_FOLDER = './game';
    var MISSION_DEFINITIONS_PATH = './missions/mission';
    var FORCE_SHUTDOWN_TIMEOUT = 120;

    var htmlTemplates = {
        ERROR_400: fs.readFileSync('errors/400.html'),
        ERROR_401: fs.readFileSync('errors/401.html'),
        ERROR_403: fs.readFileSync('errors/403.html'),
        ERROR_404: fs.readFileSync('errors/404.html'),
        ERROR_405: fs.readFileSync('errors/405.html'),
        ERROR_500: fs.readFileSync('errors/500.html')
    };

    var app = express();
    app.use(bodyparser.json({
        limit: '50mb'
    })); // to support JSON-encoded bodies
    app.use(bodyparser.urlencoded({
        extended: true
    })); // to support URL-encoded bodies
    app.use(cookieparser());
    app.engine('html', ejs.renderFile);
    app.use('/css', express.static(__dirname + '/css'));
    app.use('/img', express.static(__dirname + '/img'));
    app.use('/js', express.static(__dirname + '/js'));

    app.get('/dashboard/*', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onGETRequest(request, response);
    });
    app.get('/game/*', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onGETRequest(request, response);
    });
    app.get('/missions/*', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onGETRequest(request, response);
    });
    app.get('/savegamelist', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onSaveGameListRequest(request, response);
    });
    app.get('/savegame*', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onSaveGameLoadRequest(request, response);
    });
    app.get('/loginstatus', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onLoginStatusRequest(request, response);
    });
    app.get('/scoreboard', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onScoreBoardRequest(request, response);
    });
    app.get('/admin/users/total', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onNumberOfUsersRequest(request, response);
    });
    app.get('/admin/games/total', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onNumberOfGamesRequest(request, response);
    });
    app.get('/admin/games/lastModified*', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        onLastModifiedGamesRequest(request, response);
    });

    app.get('/*', function (request, response) {
        log('HTTP: GET request: ' + request.url);
        if (request.url == '/favicon.ico') {
            onGETRequest(request, response);
        } else {
            sendErrorResponse(response, 404);
        }
    });

    app.post('/*', function (request, response) {
        onPOSTRequest(request, response);
    });

    var httpServer;
    if (ENABLE_HTTPS) {
        var credentials = {
            key: fs.readFileSync('./ssl/server.key'),
            cert: fs.readFileSync('./ssl/server.crt')
        };
        httpServer = https.createServer(credentials, app);
    } else {
        httpServer = http.createServer(app);
    }

    var dbConnection = null;

    function start() {
        mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/' + DATABASE_NAME, function (error, database) {
            if (error) {
                throw error;
            } else {
                log('DB: Connection opened.', true);
                dbConnection = database;
                httpServer.listen(PORT, function () {
                    if (ENABLE_HTTPS) {
                        log('HTTP: SSL/TLS server listening on port ' + PORT + '.', true);
                    } else {
                        log('HTTP: Server listening on port ' + PORT + '.', true);
                    }
                    periodicSessionCleaning();
                    setInterval(periodicSessionCleaning, SESSION_CLEANING_INTERVAL * 1000);
                    periodicScoreboardRefresh();
                    setInterval(periodicScoreboardRefresh, SCOREBOARD_REFRESH_INTERVAL * 1000);
                });
            }
        });
    }

    function stop(callback) {
        log('Please wait. Trying to shut down the server. Forced process termination after ' + FORCE_SHUTDOWN_TIMEOUT + ' seconds.', true);
        setTimeout(function () {
            log('FORCED SHUTDOWN :(', true);
            process.exit();
        }, FORCE_SHUTDOWN_TIMEOUT * 1000);
        httpServer.close(function () {
            log('HTTP: Server down.', true);
            if (dbConnection) {
                dbConnection.close();
                log('DB: Connection closed.', true);
            }
            callback();
        });
    }

    function log(message, ignoreQuiet) {
        if (VERBOSE || ignoreQuiet) {
            console.log(message);
        }
    }

    function getMission(missionID) {
        var localPath = MISSION_DEFINITIONS_PATH + missionID + '.json';
        if (fs.existsSync(localPath)) {
            return JSON.parse(fs.readFileSync(localPath));
        } else {
            return '';
        }
    }

    function periodicSessionCleaning() {
        log('DB: Session cleanup start @ ' + new Date());
        cleanSessions(function (error) {
            if (error) {
                log(error);
                return;
            }
            log('DB: Session cleanup finish @ ' + new Date());
        });
    }

    function periodicScoreboardRefresh() {
        log('DB: Scoreboard refresh start @ ' + new Date());

        var users = {};

        //private functions
        function getMaximumScore(record) {
            var missionID = record.missionID;
            var parser = new spacehopper.SaveGameParser(MISSION_DEFINITIONS_PATH, missionID, record.data, null);
            return parser.getMaximumScore();
        }

        function addOrUpdateScore(scores, error, score, userID, missionID) {
            if (error) {
                return;
            }
            var maxScore = users[userID][missionID];
            if (maxScore.score == 0) {
                return;
            }
            if (score) {
                if (utility.isParetoDominant(maxScore, score)) {
                    score.score = maxScore.score;
                    score.totalDeltaV = maxScore.totalDeltaV;
                    score.passedDays = maxScore.passedDays;
                    scores.save(score, function (error) {});
                }
            } else {
                score = {
                    userID: new mongodb.ObjectID.createFromHexString(userID),
                    score: maxScore.score,
                    totalDeltaV: maxScore.totalDeltaV,
                    passedDays: maxScore.passedDays,
                    missionID: parseInt(missionID)
                };
                scores.insert(score, function (error, records) {});
            }
        }

        var saveGames = dbConnection.collection('savegames');
        var query = {
            userID: {
                $ne: null
            },
            recomputeScore: true
        };
        saveGames.find(query).toArray(function (error, records) {
            if (error) {
                callback(null);
                return;
            }
            for (var i = 0; i < records.length; i++) {
                var record = records[i];

                record.recomputeScore = false;
                saveGames.save(record, function () {});

                var userID = record.userID.toHexString();
                var missionID = record.missionID;
                if (users[userID]) {
                    if (users[userID][missionID] == null) {
                        users[userID][missionID] = {
                            score: 0,
                            totalDeltaV: 0,
                            passedDays: 0
                        };
                    }
                } else {
                    users[userID] = {};
                    users[userID][missionID] = {
                        score: 0,
                        totalDeltaV: 0,
                        passedDays: 0
                    };
                }
                var curMaxScore = users[userID][missionID];
                var newMaxScore = getMaximumScore(record);
                if (utility.isParetoDominant(newMaxScore, curMaxScore)) {
                    users[userID][missionID] = newMaxScore;
                }
            }
            var scores = dbConnection.collection('scores');
            for (var userID in users) {
                for (var missionID in users[userID]) {
                    var query = {
                        userID: new mongodb.ObjectID.createFromHexString(userID),
                        missionID: parseInt(missionID)
                    };
                    (function (userID, missionID) {
                        scores.findOne(query, function (error, score) {
                            addOrUpdateScore(scores, error, score, userID, missionID);
                        });
                    })(userID, missionID);
                }
            }

            log('DB: Scoreboard refresh finish @ ' + new Date());
        });
    }

    function jsonifySaveGame(nodeList, nodeHistory) {
        var result = {};
        result.nodeHistory = nodeHistory.clone();
        var nodes = {};
        for (var nodeID in nodeList) {
            var node = nodeList[nodeID];
            var gameState = node.getValue();
            var transferLeg = gameState.getTransferLeg();
            var id = node.getKey();
            var parent = node.getParent();
            var isVirtual = node.isVirtual();

            var orbitingBodyID = gameState.getOrbitingBody().getID();
            var vehicle = gameState.getVehicle();
            var performLanding = (parent ? !parent.getValue().getVehicle().isLanded() && vehicle.isLanded() : false);

            var nodeResult = {};
            nodeResult.id = id;
            nodeResult.parentID = (parent ? parent.getKey() : null);
            nodeResult.isVirtual = isVirtual;
            nodeResult.gameState = {};
            nodeResult.gameState.orbitingBodyID = orbitingBodyID;
            nodeResult.gameState.transferLeg = null;
            if (transferLeg) {
                nodeResult.gameState.transferLeg = {};
                nodeResult.gameState.transferLeg.chromosome = transferLeg.chromosome;
                nodeResult.gameState.transferLeg.timeOfFlight = transferLeg.timeOfFlight;
                nodeResult.gameState.transferLeg.problemType = transferLeg.problemType;
                nodeResult.gameState.transferLeg.deltaV = transferLeg.deltaV;
                nodeResult.gameState.transferLeg.performLanding = performLanding;
            }
            if (nodeResult.parentID == null) {
                nodeResult.gameState.epoch = gameState.getEpoch();
                var isLanded = vehicle.isLanded();
                var velocityInf = vehicle.getVelocityInf();
                var stages = vehicle.getStages();

                nodeResult.gameState.vehicle = {};
                nodeResult.gameState.vehicle.velocityInf = velocityInf.asArray();
                nodeResult.gameState.vehicle.isLanded = vehicle.isLanded();
                nodeResult.gameState.vehicle.stages = [];
                for (var i = 0; i < stages.length; i++) {
                    var stage = stages[i];
                    nodeResult.gameState.vehicle.stages.push({
                        propulsionType: stage.getPropulsionType(),
                        mass: stage.getTotalMass(),
                        remainingMass: stage.getRemainingMass(),
                        emptyMass: stage.getEmptyMass(),
                        thrust: stage.getThrust(),
                        specificImpulse: stage.getSpecificImpulse(),
                        imageURL: stage.getImageURL()
                    });
                }

                var mappedFaces = gameState.getMappedFaces();
                nodeResult.gameState.mappedFaces = {};
                for (var face in mappedFaces) {
                    for (var i = 0; i < mappedFaces[face].length; i++) {
                        if (nodeResult.gameState.mappedFaces[face]) {
                            nodeResult.gameState.mappedFaces[face].push(mappedFaces[face][i].asArray());
                        } else {
                            nodeResult.gameState.mappedFaces[face] = [mappedFaces[face][i].asArray()];
                        }
                    }
                }
            }
            nodes[nodeResult.id] = nodeResult;
        }
        result.nodes = nodes;
        return result;
    }

    function checkAndAppendDeltaData(missionID, saveGameData, deltaData, overwrite, callback) {
        if (missionID == null || deltaData == null) {
            callback(null);
            return;
        }

        if (saveGameData == null) {
            var parser = new spacehopper.SaveGameParser(MISSION_DEFINITIONS_PATH, missionID, null, deltaData);
            var checkedSaveGame = parser.extractCheckedSaveGame();
            saveGameData = jsonifySaveGame(checkedSaveGame.nodes, checkedSaveGame.nodeHistory);

        } else {
            var parser = null;
            if (overwrite) {
                parser = new spacehopper.SaveGameParser(MISSION_DEFINITIONS_PATH, missionID, null, deltaData);
            } else {
                parser = new spacehopper.SaveGameParser(MISSION_DEFINITIONS_PATH, missionID, saveGameData, deltaData);
            }

            var checkedSaveGame = parser.extractCheckedSaveGame(true);
            var saveGameDeltaData = jsonifySaveGame(checkedSaveGame.nodes, checkedSaveGame.nodeHistory);

            if (overwrite) {
                saveGameData.nodes = {};
                saveGameData.nodeHistory = saveGameDeltaData.nodeHistory.clone();
            } else {
                saveGameData.nodeHistory.append(saveGameDeltaData.nodeHistory);
            }

            for (var id in saveGameDeltaData.nodes) {
                saveGameData.nodes[id] = saveGameDeltaData.nodes[id];
            }
        }

        log('DB: Checked savegame for correctness.');
        callback(saveGameData);
    }

    var deferredSessionUpdates = {};

    function updateSession(session, date) {

        // Private function
        function updateRecord(session, date) {
            var sessions = dbConnection.collection('sessions');
            var timeout = new Date(date.getTime() + SESSION_TIMEOUT * 1000);
            var query = {
                _id: session._id
            };
            var update = {
                $set: {
                    timeout: timeout
                }
            };
            sessions.update(query, update, function (error) {
                if (error) {
                    log('DB: Updating session with id ' + session._id + ' failed.');
                    return;
                }
                log('DB: Updated session entry with id ' + session._id + ' to new timeout ' + timeout);

                delete deferredSessionUpdates[session._id];
            });
        }


        if (session) {
            if (deferredSessionUpdates[session._id.toHexString()] == null) {
                deferredSessionUpdates[session._id.toHexString()] = setTimeout(function () {
                    updateRecord(session, date);
                }, 1000);
            } else {
                clearTimeout(deferredSessionUpdates[session._id.toHexString()]);
                deferredSessionUpdates[session._id.toHexString()] = setTimeout(function () {
                    updateRecord(session, date);
                }, 1000);
            }
        }
    }

    function addSessionForUser(user, date, callback) {
        var sessions = dbConnection.collection('sessions');
        sessions.find({}, {
            sessionID: 1
        }).toArray(function (error, results) {
            var sessionIDs = {};
            for (var i = 0; i < results.length; i++) {
                sessionIDs[results[i].sessionID] = true;
            }
            var sessionID = randomstring.generate(SESSION_ID_LENGTH);
            while (sessionIDs[sessionID]) {
                sessionID = randomstring.generate(SESSION_ID_LENGTH);
            }
            var timeout = new Date(date.getTime() + SESSION_TIMEOUT * 1000);

            var session = {
                userID: user._id,
                sessionID: sessionID,
                timeout: timeout
            }
            sessions.insert(session, function (error, records) {
                if (error) {
                    callback(null);
                    return;
                }
                log('DB: Created session entry for user ' + user.name);
                callback(records[0]);
            });
        });
    }

    function deleteSession(session, response, callback) {
        if (session) {
            var sessions = dbConnection.collection('sessions');
            var query = {
                sessionID: session.sessionID
            };
            sessions.remove(query, function (error) {
                if (error) {
                    callback(error);
                    return;
                }
                log('DB: Deleted session entry with session id ' + session.sessionID);
                callback(null);
            });
        } else {
            callback(null);
        }
    }

    function cleanSessions(callback) {
        var sessions = dbConnection.collection('sessions');
        var now = new Date();
        var query = {
            timeout: {
                '$lt': now
            }
        };
        sessions.remove(query, function (error) {
            if (error) {
                callback(error);
                return;
            }
            log('DB: Cleaned session collection from timed out entries');
            callback(null);
        });
    }

    function searchSession(request, date, callback) {
        if (request.cookies) {
            var sessionID = request.cookies['sessionID'];
            if (sessionID) {
                var sessions = dbConnection.collection('sessions');
                var query = {
                    sessionID: sessionID,
                    timeout: {
                        '$gte': date
                    }
                };
                sessions.findOne(query, function (error, session) {
                    if (error) {
                        callback(null);
                        return;
                    }
                    callback(session);
                });
            } else {
                callback(null);
            }
        } else {
            callback(null);
        }
    }

    function getNumberOfRegisteredUsers(callback) {
        var users = dbConnection.collection('users');
        users.find({}).toArray(function (error, usersArray) {
            if (error) {
                callback(null);
                return;
            }
            callback(usersArray.length);
        });
    }

    function getUserForSession(session, callback) {
        if (session) {
            var users = dbConnection.collection('users');
            var query = {
                _id: session.userID
            };
            users.findOne(query, function (error, user) {
                if (error) {
                    callback(null);
                    return;
                }
                callback(user);
            });
        } else {
            callback(null);
        }
    }

    function getUserByName(name, callback) {
        var users = dbConnection.collection('users');
        var query = {
            name: name
        };
        users.findOne(query, function (error, user) {
            if (error) {
                callback(null);
                return;
            }
            callback(user);
        });
    }

    function addUser(name, password, callback) {
        var users = dbConnection.collection('users');
        var chunk = randomstring.generate(8);
        var hash = crypto.createHash('sha256');
        var hashedPassword = hash.update(password + chunk).digest('base64');
        var user = {
            name: name,
            isExpert: false,
            password: hashedPassword,
            chunk: chunk
        };
        users.insert(user, function (error, records) {
            if (error) {
                callback(null);
                return;
            }
            log('DB: Added user entry with name ' + records[0].name);
            callback(records[0]);
        });
    }

    function updateUserExpertInfo(user, isExpert, callback) {
        var users = dbConnection.collection('users');
        user.isExpert = isExpert;
        users.save(user, function (error) {
            if (error) {
                callback(null);
                return;
            }
            callback(user);
        });
    }

    function addSaveGame(user, missionID, missionRevision, name, deltaData, date, callback) {
        if (missionID != null && deltaData.nodes && deltaData.nodeHistory && Object.keys(deltaData.nodes).length && deltaData.nodeHistory.length) {
            var saveGames = dbConnection.collection('savegames');
            if (user && name) {
                var query = {
                    userID: user._id,
                    missionID: missionID,
                    name: name
                };
                saveGames.findOne(query, function (error, record) {
                    if (error || record) {
                        callback(null);
                        return;
                    }
                    checkAndAppendDeltaData(missionID, null, deltaData, false, function (checkedSaveGame) {
                        record = {
                            userID: user._id,
                            data: {
                                nodes: checkedSaveGame.nodes,
                                nodeHistory: checkedSaveGame.nodeHistory
                            },
                            deltaIndex: checkedSaveGame.nodeHistory.length,
                            name: name,
                            missionID: missionID,
                            missionRevision: missionRevision,
                            lastModified: date,
                            recomputeScore: true
                        };
                        saveGames.insert(record, function (error, records) {
                            if (error) {
                                callback(null);
                                return;
                            }
                            callback(records[0]);
                        });
                    });
                });
            } else {
                checkAndAppendDeltaData(missionID, null, deltaData, false, function (checkedSaveGame) {
                    var record = {
                        userID: (user ? user._id : null),
                        data: {
                            nodes: checkedSaveGame.nodes,
                            nodeHistory: checkedSaveGame.nodeHistory
                        },
                        deltaIndex: checkedSaveGame.nodeHistory.length,
                        name: name,
                        missionID: missionID,
                        missionRevision: missionRevision,
                        lastModified: date,
                        recomputeScore: user != null
                    };
                    saveGames.insert(record, function (error, records) {
                        if (error) {
                            callback(null);
                            return;
                        }
                        callback(records[0]);
                    });
                });
            }
        } else {
            callback(null);
        }
    }

    function updateSaveGame(gameID, user, missionID, missionRevision, name, deltaData, deltaIndex, date, callback) {

        // Private function
        function deleteRecordIfEmpty(saveGames, record, callback) {
            if (record.data.nodeHistory.length) {
                saveGames.save(record, function (error) {
                    if (error) {
                        callback(null);
                        return;
                    }
                    log('DB: Updated savegame entry with delta data of ' + JSON.stringify(deltaData).length + ' Bytes');
                    callback(record);
                });
            } else {
                query = {
                    _id: record._id
                };
                saveGames.remove(query, function (error) {
                    if (error) {
                        callback(null);
                        return;
                    }
                    log('DB: Savegame entry was empty and therefore deleted');
                    callback(null);
                });
            }
        }

        if (!gameID) {
            callback(null);
            return;
        }
        var saveGames = dbConnection.collection('savegames');
        var query = {
            _id: gameID,
            userID: (user ? user._id : null)
        };
        saveGames.findOne(query, function (error, record) {
            if (error) {
                callback(null);
                return;
            }
            if (record) {
                if (user && name && record.name != name) {
                    query = {
                        name: name,
                        missionID: missionID,
                        userID: user._id
                    };
                    saveGames.findOne(query, function (error, existingRecord) {
                        if (error || existingRecord) {
                            callback(null);
                            return;
                        }
                        if (deltaIndex == record.deltaIndex && missionRevision == record.missionRevision && missionID == record.missionID) {
                            checkAndAppendDeltaData(missionID, record.data, deltaData, false, function (checkedSaveGame) {
                                record.data.nodes = checkedSaveGame.nodes;
                                record.data.nodeHistory = checkedSaveGame.nodeHistory;
                                record.name = name != null ? name : record.name;
                                record.deltaIndex = record.data.nodeHistory.length;
                                record.lastModified = date;
                                record.recomputeScore = true;

                                deleteRecordIfEmpty(saveGames, record, callback);
                            });
                        } else {
                            checkAndAppendDeltaData(missionID, record.data, deltaData, true, function (checkedSaveGame) {
                                record.data = checkedSaveGame;
                                record.name = name;
                                record.deltaIndex = record.data.nodeHistory.length;
                                record.missionID = missionID;
                                record.missionRevision = missionRevision;
                                record.lastModified = date;
                                record.recomputeScore = true;

                                deleteRecordIfEmpty(saveGames, record, callback);
                            });
                        }

                    });
                } else {
                    if (deltaIndex == record.deltaIndex && missionRevision == record.missionRevision && missionID == record.missionID) {
                        checkAndAppendDeltaData(missionID, record.data, deltaData, false, function (checkedSaveGame) {
                            record.data.nodes = checkedSaveGame.nodes;
                            record.data.nodeHistory = checkedSaveGame.nodeHistory;
                            record.name = name != null ? name : record.name;
                            record.deltaIndex = record.data.nodeHistory.length;
                            record.lastModified = date;
                            record.recomputeScore = user != null;

                            deleteRecordIfEmpty(saveGames, record, callback);
                        });
                    } else {
                        checkAndAppendDeltaData(missionID, record.data, deltaData, true, function (checkedSaveGame) {
                            record.data = checkedSaveGame;
                            record.name = name;
                            record.deltaIndex = record.data.nodeHistory.length;
                            record.missionID = missionID;
                            record.missionRevision = missionRevision;
                            record.lastModified = date;
                            record.recomputeScore = user != null;

                            deleteRecordIfEmpty(saveGames, record, callback);
                        });
                    }
                }
            } else {
                log('DB: Savegame entry not found and therefore nothing updated');
                callback(null);
            }
        });
    }

    function getSaveGamesForUser(user, callback) {
        var saveGames = dbConnection.collection('savegames');
        var query = {
            userID: user._id,
            name: {
                $ne: null
            }
        };
        saveGames.find(query).toArray(function (error, records) {
            if (error) {
                callback(null);
                return;
            }
            callback(records);
        });
    }

    function getSaveGame(id, callback) {
        var saveGames = dbConnection.collection('savegames');
        var query = {
            _id: id
        };
        saveGames.findOne(query, function (error, record) {
            if (error) {
                callback(null);
                return;
            }
            callback(record);
        });
    }

    function getLastModifiedSaveGames(date, callback) {
        if (!date) {
            date = new Date(new Date().getTime() - 10 * 60 * 1000);
        }
        var saveGames = dbConnection.collection('savegames');
        var query = {
            lastModified: {
                '$gte': date
            }
        };
        saveGames.find(query).toArray(function (error, records) {
            if (error) {
                callback(null);
                return;
            }
            callback(records);
        });
    }

    function getNumberOfGames(callback) {
        var saveGames = dbConnection.collection('savegames');
        saveGames.find({}).toArray(function (error, saveGameArray) {
            if (error) {
                callback(null);
                return;
            }
            callback(saveGameArray.length);
        });
    }

    function updateSessionCookie(session, response) {
        if (session) {
            response.cookie('sessionID', session.sessionID, {
                maxAge: SESSION_TIMEOUT * 1000
            });
            log('HTTP: Updated session expiring date with id ' + session._id);
        }
    }

    function deleteSessionCookie(session, response) {
        if (session) {
            response.cookie('sessionID', '');
            log('HTTP: Cleaned cookie from response header');
        }
    }

    function saveGameListToHTML(records) {
        if (records) {
            if (records.length == 0) {
                return '<p style="font-size:small;color:#cccccc;">No missions have been saved yet</p>';
            } else {
                var htmlText = '<ul>';
                records.forEach(function (record) {
                    htmlText += "\n" + '<li id="' + record._id.toHexString() + '" class="savegame-entry"><div class="name text-fit">' + record.name + '</div><div class="tip text-fit"> (mission ' + record.missionID + ')</div></li>';
                });
                htmlText += "\n" + '</ul>';
                return htmlText;
            }
        } else {
            return '<p style="font-size:small;color:#cccccc;">error</p>';
        }
    }

    function sendErrorResponse(response, errorCode) {
        var key = 'ERROR_' + errorCode;
        response.setHeader('Cache-Control', 'public, max-age=0');
        response.writeHeader(errorCode);
        response.write(htmlTemplates[key]);
        response.end();
        log('HTTP: Sent error response ' + errorCode);
    }

    function sendSuccessResponse(response) {
        response.status(200).end()
    }

    function onLoginRequest(request, response) {
        var name = request.body.name;
        var password = request.body.password;
        if (name && password) {
            getUserByName(name, function (user) {
                if (user) {
                    var chunk = user.chunk;
                    var correctHashedPassword = user.password;
                    var hash = crypto.createHash('sha256');
                    var hashedPassword = hash.update(password + chunk).digest('base64');
                    if (correctHashedPassword == hashedPassword) {
                        addSessionForUser(user, new Date(), function (session) {
                            if (!session) {
                                sendErrorResponse(response, 500);
                                return;
                            } else {
                                updateSessionCookie(session, response);
                                sendSuccessResponse(response);
                                log('HTTP: Login request by user ' +  user.name + ' completed');
                            }
                        });
                    } else {
                        sendErrorResponse(response, 403);
                        log('HTTP: Login request denied');
                    }
                } else {
                    sendErrorResponse(response, 403);
                    log('HTTP: Login request denied');
                }
            });
        } else {
            sendErrorResponse(response, 403);
            log('HTTP: Login request denied');
        }
    }

    function onLogoutRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                deleteSession(session, response, function (error) {
                    if (error) {
                        sendErrorResponse(response, 500);
                        return;
                    }
                    deleteSessionCookie(session, response);
                    response.redirect('/dashboard/index.html#signin');
                    response.end();
                    log('HTTP: Logout request completed');
                });
            });
        });
    }

    function onRegisterRequest(request, response) {
        var name = request.body.name;
        name = escape(name);
        var password = request.body.password;
        if (name && password) {
            if (name.length > 0 && password.length > 0) {
                if (name.indexOf(',') != -1) {
                    response.write('Username contains invalid characters.');
                    response.end();
                    log('HTTP: Register request completed');
                    return;
                }
                getUserByName(name, function (user) {
                    if (user) {
                        response.write('This username is already in use.');
                        response.end();
                        log('HTTP: Register request completed');
                    } else {
                        addUser(name, password, function (user) {
                            if (user) {
                                addSessionForUser(user, new Date(), function (session) {
                                    if (!session) {
                                        sendErrorResponse(response, 500);
                                    } else {
                                        updateSessionCookie(session, response);
                                        response.write('OK');
                                        response.end();
                                        log('HTTP: Register request by user ' + user.name + ' completed');
                                    }
                                });
                            } else {
                                sendErrorResponse(response, 500);
                            }
                        });
                    }
                });
            }
        } else {
            sendErrorResponse(response, 400);
            log('HTTP: Register request message malformatted and ignored');
        }
    }

    function onLoginStatusRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                response.setHeader('Content-Type', 'application/json');
                if (user) {
                    response.write(JSON.stringify({
                        isLoggedIn: true
                    }));
                } else {
                    response.write(JSON.stringify({
                        isLoggedIn: false
                    }));
                }
                response.end();
                log('HTTP: Loginstatus request completed');
            });
        });
    }

    function onSaveGameUpdateRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                var gameID = request.body.gameID;
                var missionID = request.body.missionID;
                var missionRevision = request.body.missionRevision;
                var name = request.body.name;
                var deltaData = request.body.deltaData;
                var deltaIndex = request.body.deltaIndex;
                if ((deltaData != null) && (deltaIndex != null) && (gameID != null) && (missionRevision != null) && (missionID != null)) {
                    gameID = new mongodb.ObjectID.createFromHexString(gameID);
                    missionID = parseInt(missionID);
                    name = name != null ? escape(name) : null;
                    deltaData = JSON.parse(deltaData);
                    deltaIndex = parseInt(deltaIndex);
                    missionRevision = parseInt(missionRevision);
                    updateSaveGame(gameID, user, missionID, missionRevision, name, deltaData, deltaIndex, now, function (saveGame) {
                        if (!saveGame) {
                            sendErrorResponse(response, 500);
                            return;
                        }
                        updateSession(session, now);
                        updateSessionCookie(session, response);
                        response.setHeader('Content-Type', 'application/json');
                        response.write(JSON.stringify({
                            gameID: saveGame._id.toHexString(),
                            missionRevision: saveGame.missionRevision,
                            deltaIndex: saveGame.deltaIndex
                        }));
                        response.end();
                        log('HTTP: Savegame update request completed');
                    });
                } else {
                    sendErrorResponse(response, 400);
                    log('HTTP: Savegame update request message malformatted and ignored');
                }
            });
        });
    }

    function onSaveGameInitRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                var missionID = request.body.missionID;
                var missionRevision = request.body.missionRevision;
                var name = request.body.name;
                var deltaData = request.body.deltaData;
                if ((deltaData != null) && (missionID != null) && (missionRevision != null)) {
                    deltaData = JSON.parse(deltaData);
                    name = name != null ? escape(name) : null;
                    addSaveGame(user, parseInt(missionID), parseInt(missionRevision), name, deltaData, now, function (saveGame) {
                        if (!saveGame) {
                            sendErrorResponse(response, 500);
                            return;
                        }
                        updateSession(session, now);
                        updateSessionCookie(session, response);
                        response.setHeader('Content-Type', 'application/json');
                        response.write(JSON.stringify({
                            gameID: saveGame._id.toHexString(),
                            missionRevision: saveGame.missionRevision
                        }));
                        response.end();
                        log('HTTP: Autosave init request completed');
                    });
                } else {
                    sendErrorResponse(response, 400);
                    log('HTTP: Autosave init request message malformatted and ignored');
                }
            });
        });
    }

    function onSaveGameInfosRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                var gameID = request.body.gameID;
                if ((gameID != null)) {
                    try {
                        gameID = new mongodb.ObjectID.createFromHexString(gameID);
                        getSaveGame(gameID, function (saveGame) {
                            if (!saveGame) {
                                sendErrorResponse(response, 404);
                                return;
                            }
                            if (saveGame.userID && !user) {
                                sendErrorResponse(response, 403);
                                return;
                            }
                            response.setHeader('Content-Type', 'application/json');
                            if (saveGame) {
                                response.write(JSON.stringify({
                                    deltaIndex: saveGame.deltaIndex,
                                    missionRevision: saveGame.missionRevision,
                                    name: saveGame.name
                                }));
                            } else {
                                response.write(JSON.stringify({
                                    deltaIndex: 0,
                                    missionRevision: -1,
                                    name: ''
                                }));
                            }
                            response.end();
                            if (user) {
                                log('HTTP: Savegame infos request by user ' + user.name + ' completed');
                            } else {
                                log('HTTP: Savegame infos request by unknown user completed');
                            }
                        });
                    } catch (error) {
                        response.setHeader('Content-Type', 'application/json');
                        response.write(JSON.stringify({
                            deltaIndex: 0,
                            name: ''
                        }));
                        response.end();
                    }
                } else {
                    sendErrorResponse(response, 400);
                    log('HTTP: Savegame infos request message malformatted and ignored');
                }
            });
        });
    }

    function onSaveGameLoadRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                var parsedUrl = url.parse(request.url, true);
                var id = parsedUrl.query.gameID;
                if (id) {
                    id = new mongodb.ObjectID.createFromHexString(id);
                    getSaveGame(id, function (saveGame) {
                        if (!saveGame) {
                            sendErrorResponse(response, 404);
                            return;
                        }
                        if (saveGame.userID) {
                            if ((user != null) && (user._id.equals(saveGame.userID))) {
                                var missionData = getMission(saveGame.missionID);
                                response.setHeader('Content-Type', 'application/json');
                                response.write(JSON.stringify({
                                    saveGame: saveGame.data,
                                    mission: missionData.mission
                                }));
                                response.end();
                                log('HTTP: Savegame load by user ' + user.name + ' completed');
                            } else {
                                sendErrorResponse(response, 403);
                                log('HTTP: Savegame load request denied');
                            }
                        } else {
                            var missionData = getMission(saveGame.missionID);
                            response.setHeader('Content-Type', 'application/json');
                            response.write(JSON.stringify({
                                saveGame: saveGame.data,
                                mission: missionData.mission
                            }));
                            response.end();
                            log('HTTP: Savegame load by unkown user completed');
                        }
                    });
                } else {
                    sendErrorResponse(response, 400);
                    log('HTTP: Savegame load request message malformatted and ignored');
                }
            });
        });
    }

    function onSaveGameListRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                if (user) {
                    getSaveGamesForUser(user, function (records) {
                        updateSession(session, now);
                        updateSessionCookie(session, response);
                        response.write(saveGameListToHTML(records));
                        response.end();
                        log('HTTP: Savegame list request by user ' + user.name + ' completed');
                    });
                } else {
                    sendErrorResponse(response, 403);
                    log('HTTP: Savegame list request denied');
                }
            });
        });
    }

    function onScoreBoardRequest(request, response) {
        var missionID = url.parse(request.url, true).query.missionID;
        if (missionID) {
            try {
                missionID = parseInt(missionID);
            } catch (error) {
                sendErrorResponse(response, 500);
                return;
            }
            var result = 'username,score,totalDeltaV,passedDays' + "\n";
            var scores = dbConnection.collection('scores');
            var query = {
                missionID: missionID
            };
            scores.find(query).toArray(function (error, scoreRecords) {
                if (error) {
                    sendErrorResponse(response, 500);
                    return;
                }
                if (scoreRecords && scoreRecords.length) {
                    var users = dbConnection.collection('users');
                    users.find({}).toArray(function (error, userRecords) {
                        if (error) {
                            sendErrorResponse(response, 500);
                            return;
                        }
                        if (userRecords) {
                            var tmpUsers = {};
                            userRecords.forEach(function (user) {
                                tmpUsers[user._id] = user;
                            });
                            scoreRecords.forEach(function (score) {
                                var user = tmpUsers[score.userID];
                                if (!user) {
                                    return;
                                }
                                result += user.name + ',' + score.score + ',' + score.totalDeltaV + ',' + score.passedDays + "\n";
                            });
                            response.setHeader('Content-Type', 'text/csv');
                            response.write(result);
                            response.end();
                            log('HTTP: ScoreBoard request completed');
                        } else {
                            response.setHeader('Content-Type', 'text/csv');
                            response.write(result);
                            response.end();
                            log('HTTP: ScoreBoard request completed');
                        }
                    });
                } else {
                    response.setHeader('Content-Type', 'text/csv');
                    response.write(result);
                    response.end();
                    log('HTTP: ScoreBoard request completed');
                }
            });
        } else {
            sendErrorResponse(response, 400);
            log('HTTP: Scoreboard request message malformatted and ignored');
        }
    }

    function onExpertUpdateRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                if (user) {
                    var isExpert = request.body.value == 'true';
                    updateUserExpertInfo(user, isExpert, function (modifiedUser) {
                        if (!modifiedUser) {
                            sendErrorResponse(response, 500);
                            return;
                        }
                        updateSession(session, now);
                        updateSessionCookie(session, response);
                        if (user.isExpert) {
                            response.write('everyone is entitled to their own opinion.');
                        } else {
                            response.write('goodbye, expert.')
                        }
                        response.end();
                    });
                } else {
                    sendErrorResponse(response, 403);
                    log('HTTP: Savegame list request denied');
                }
            });
        });
    }

    function onNumberOfUsersRequest(request, response) {
        getNumberOfRegisteredUsers(function (numUsers) {
            if (numUsers == null) {
                sendErrorResponse(response, 500);
                return;
            }
            response.write(numUsers.toString());
            response.end();
        });
    }

    function onNumberOfGamesRequest(request, response) {
        getNumberOfGames(function (numGames) {
            if (numGames == null) {
                sendErrorResponse(response, 500);
                return;
            }
            response.write(numGames.toString());
            response.end();
        });
    }

    function onLastModifiedGamesRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                if (user && user.isAdmin) {
                    var parsedUrl = url.parse(request.url, true);
                    var date = new Date(parsedUrl.query.date);

                    getLastModifiedSaveGames(date, function (records) {
                        response.setHeader('Content-Type', 'text/csv');
                        var result = 'id,missionID,size,lastModified' + "\n";
                        records.forEach(function (record) {
                            result += record._id.toHexString() + ',' + record.missionID + ',' + JSON.stringify(record.data).length + ',' + record.lastModified + "\n";
                        });
                        response.write(result);
                        response.end();
                        response.end();
                    });
                } else {
                    sendErrorResponse(response, 403);
                }
            });
        });
    }

    function onGETRequest(request, response) {
        var now = new Date();
        searchSession(request, now, function (session) {
            getUserForSession(session, function (user) {
                var templateTools = {
                    user: user,
                    request: request,
                    response: response
                };
                if (!session && (request.url.endsWith('/dashboard/profiletab.html'))) {
                    sendErrorResponse(response, 403);
                    return;
                }

                updateSession(session, now);
                updateSessionCookie(session, response);

                var parsedUrl = url.parse(request.url);

                var localPath = __dirname + parsedUrl.pathname;
                if (fs.existsSync(localPath) && !fs.lstatSync(localPath).isDirectory()) {
                    var mimeType = mime.lookup(localPath);
                    switch (mimeType) {
                    case 'text/html':
                        response.render(localPath, templateTools);
                        break;

                    default:
                        response.setHeader('Cache-Control', 'public, max-age=' + FILE_CACHING_TIME * 1000);
                        response.setHeader('Content-Type', mimeType);
                        response.write(fs.readFileSync(localPath));
                        break;
                    }
                    response.end();
                } else {
                    sendErrorResponse(response, 404);
                }
            });
        });
    }

    function onPOSTRequest(request, response) {
        var type = request.body.type;
        log('HTTP: POST request: Type: ' + type);
        switch (type) {
        case 'login':
            onLoginRequest(request, response);
            break;
        case 'register':
            onRegisterRequest(request, response);
            break;
        case 'logout':
            onLogoutRequest(request, response);
            break;
        case 'savegameinit':
            onSaveGameInitRequest(request, response);
            break;
        case 'savegameinfos':
            onSaveGameInfosRequest(request, response);
            break;
        case 'savegameupdate':
            onSaveGameUpdateRequest(request, response);
            break;

        case 'updateexpert':
            onExpertUpdateRequest(request, response);
            break;
        default:
            sendErrorResponse(response, 400);
            break;
        }
    }


    // Exposed Interface:
    Server.start = start;
    Server.stop = stop;
})();

process.on('SIGINT', function () {
    console.log("\n" + 'SIGINT');
    Server.stop(function () {
        process.exit();
    });
});

// Start server
Server.start();