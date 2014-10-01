/* Class GameEngine. 
    Overall Control
*/
core.GameEngine = function () {
    var self = this;
    this._mousePosition = {
        posX: 0,
        posY: 0
    };
    this._plugins = [];
    this._animationFrameID = 0;
    this._busyCounter = 0;
    this._gameStatePhase = core.GameStatePhases.ORBITING_BODY_OVERVIEW;
    this._gameState = null;
    this._gameHistoryManager = null;
    this._solver = null;

    this._funGetInvalidReasonsForState = null;
    this._funIsWinningState = null;
    this._funGetTimeUsage = null;
    this._funGetWinningProgress = null;
    this._funSetScoreForState = null;

    this._userAction = {
        nextOrbitingBody: null,
        nextLeg: {}
    };

    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(gui.FIELD_OF_VIEW * utility.RAD_TO_DEG, window.innerWidth / window.innerHeight, 1, gui.UNIVERSUM_SIZE * 2);
    // We need to have physics and gui to have the same up axis. It saves us some transformations.
    this._camera.up.set(0, 0, 1);
    if (Detector.webgl) {
        this._renderer = new THREE.WebGLRenderer({
            antialias: true
        });
    } else {
        this._renderer = new THREE.CanvasRenderer();
    }
    this._renderer.domElement.id = 'gameengine';
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._cameraController = new core.CameraController(this);
    this._projector = new THREE.Projector();

    this._centralBody = null;
    this._orbitingBodies = {};
    this._initialOrbitingBodies = {};
    this._orbitingBodyMeshs = [];


    this._busyIndicator = new gui.BusyIndicator();

    this._notificationManager = new gui.NotificationManager();

    this._scoreHUD = null;

    var mouseDriver = new utility.MouseDriver(this._renderer.domElement);
    mouseDriver.registerLeftClick(function (event) {
        self._onClick(event);
    });
    mouseDriver.registerLeftDblClick(function (event) {
        self._onDblClick(event);
    });
    mouseDriver.registerMove(function (event) {
        self._onMouseMove(event);
    });
    document.body.appendChild(this._renderer.domElement);
};

core.GameEngine.prototype = {
    constructor: core.GameEngine,

    _dispatchEvent: function (eventType, eventData) {
        if (this._plugins) {
            this._plugins.forEach(function (plugin) {
                plugin.onEvent(eventType, eventData);
            });
        }
    },

    _render: function () {
        var self = this;
        this._animationFrameID = requestAnimationFrame(function () {
            self._render();
        });
        this._update();
        this._renderer.render(this._scene, this._camera);
    },

    _update: function () {
        switch (this._gameStatePhase) {
        case core.GameStatePhases.ORBITING_BODY_OVERVIEW_LOCKED:
            this._checkForGameStateChange();
            break;

        case core.GameStatePhases.ORBITING_BODY_OVERVIEW:
            this._checkForGameStateChange();
            this._hoverOrbitingBodies();
            break;

        case core.GameStatePhases.TRANSFER_CONFIGURATION_NEXT_BODY:
            this._hoverOrbitingBodies();

            var nextBody = this._userAction.nextOrbitingBody;
            switch (nextBody.getConfigurationStatus()) {
            case core.ConfigurationStatus.CONFIRMED:
                this._changeConfigurationMode(core.TransferLegConfigurationModes.DEPARTURE);
                this._gameState.getOrbitingBody().openConfiguration(this._userAction);
                this._setGameStatePhase(core.GameStatePhases.TRANSFER_CONFIGURATION_CURRENT_BODY);
                break;

            case core.ConfigurationStatus.CANCELED:
                nextBody.onUnselected();
                this._gameHistoryManager.unlock();
                this._setGameStatePhase(core.GameStatePhases.ORBITING_BODY_OVERVIEW);
                break;
            }
            break;

        case core.GameStatePhases.TRANSFER_CONFIGURATION_CURRENT_BODY:
            for (var id in this._orbitingBodies) {
                this._orbitingBodies[id].onMouseOut();
            }

            var currentBody = this._gameState.getOrbitingBody();
            switch (currentBody.getConfigurationStatus()) {
            case core.ConfigurationStatus.CONFIRMED:
                this._setGameStatePhase(core.GameStatePhases.PROBLEM_PREPARATION);
                break;

            case core.ConfigurationStatus.CANCELED:
                this._userAction.nextOrbitingBody.onUnselected();
                this._gameHistoryManager.unlock();
                this._changeConfigurationMode(core.TransferLegConfigurationModes.ARRIVAL);
                this._setGameStatePhase(core.GameStatePhases.ORBITING_BODY_OVERVIEW);
                break;
            }
            break;

        case core.GameStatePhases.PROBLEM_PREPARATION:
            for (var id in this._orbitingBodies) {
                this._orbitingBodies[id].onMouseOut();
            }

            var problem = null;
            var nextLeg = this._userAction.nextLeg;
            var currentBody = this._gameState.getOrbitingBody();
            var nextBody = this._userAction.nextOrbitingBody;

            switch (nextLeg.problemType) {
            case astrodynamics.ProblemTypes.MGA1DSM_FLYBY:
                problem = new astrodynamics.MGA1DSMFlyby(currentBody, nextBody, this._gameState.getEpoch(), this._gameState.getVehicle().getVelocityInf(), nextLeg.timeOfFlightBounds, nextLeg.radiusBounds, nextLeg.betaBounds, nextLeg.performLanding);
                break;

            case astrodynamics.ProblemTypes.MGA1DSM_LAUNCH:
                problem = new astrodynamics.MGA1DSMLaunch(currentBody, nextBody, nextLeg.launchEpochBounds, nextLeg.velocityBounds, nextLeg.timeOfFlightBounds, nextLeg.performLanding);
                break;
            }

            this._solver = new algorithm.JDE(problem);

            nextBody.onUnselected();

            this._setBusy();
            this._setGameStatePhase(core.GameStatePhases.PROBLEM_SOLVING);
            break;

        case core.GameStatePhases.PROBLEM_SOLVING:
            if (this._solver.isFinished()) {
                if (this._solver.existsSolution()) {
                    this._notificationManager.clearScreen();
                    this._applySolution(this._solver.getSolution());
                } else {
                    this._notificationManager.dispatchErrorMsg(strings.toText(strings.GameErrors.JDE_NO_SOLUTION));
                    this._setGameState(this._gameState);
                }
                this._unsetBusy();
            } else {
                this._solver.evolve();
            }
            break;
        }

        this._centralBody.update();
        for (var id in this._orbitingBodies) {
            var currentBody = this._orbitingBodies[id];
            var curBodyPos = currentBody.getPosition();
            var currentBodyPosition = new THREE.Vector3(curBodyPos.getX(), curBodyPos.getY(), curBodyPos.getZ()).multiplyScalar(gui.POSITION_SCALE);
            var projVec = this._projector.projectVector(currentBodyPosition.clone(), this._camera);
            var screenPosition = new geometry.Vector2((projVec.x + 1) * window.innerWidth / 2, (1 - projVec.y) * window.innerHeight / 2);

            var spherePoint = currentBody.getBodyMesh().geometry.vertices[0].clone().multiplyScalar(currentBody.getBodyMesh().scale.x).add(currentBodyPosition);
            projVec = this._projector.projectVector(spherePoint.clone(), this._camera);
            var screenSpherePoint = new geometry.Vector2((projVec.x + 1) * window.innerWidth / 2, (1 - projVec.y) * window.innerHeight / 2);
            var screenRadius = screenPosition.clone().sub(screenSpherePoint).normEuclid();

            currentBody.update(screenPosition, screenRadius);
        }
        this._cameraController.update();
    },

    _changeConfigurationMode: function (configurationMode) {
        for (var id in this._orbitingBodies) {
            var currentBody = this._orbitingBodies[id];
            currentBody.onConfigurationModeChange(configurationMode);
        }
    },

    _hoverOrbitingBodies: function () {
        var bodyID = this._checkForOrbitingBodyHover();
        for (var id in this._orbitingBodies) {
            var otherBody = this._orbitingBodies[id];
            if (bodyID == otherBody.getID()) {
                if (!otherBody.isMouseOver()) {
                    otherBody.onMouseOver();
                }
            } else {
                if (otherBody.isMouseOver()) {
                    otherBody.onMouseOut();
                }
            }
        }
    },

    _checkForOrbitingBodyHover: function () {
        var mousePosition = new THREE.Vector3(this._mousePosition.posX, this._mousePosition.posY, 1);
        this._projector.unprojectVector(mousePosition, this._camera);
        var ray = new THREE.Raycaster(this._camera.position, mousePosition.subVectors(mousePosition, this._camera.position).normalize());
        var intersections = ray.intersectObjects(this._orbitingBodyMeshs);
        if (intersections.length) {
            return parseInt(intersections[0].object.gID);
        } else {
            return gui.NULL_ID;
        }
    },

    _checkForGameStateChange: function () {
        var gameState = this._gameHistoryManager.getCurrentGameState();
        if (this._gameState != gameState) {
            this._notificationManager.clearScreen();
            this._setGameState(gameState);
            var transferLeg = this._gameState.getTransferLeg();
            if (transferLeg) {
                switch (transferLeg.problemType) {
                case astrodynamics.ProblemTypes.MGA1DSM_LAUNCH:
                    var infos = transferLeg.mappedFaceID.split('_');
                    var currentBody = this._initialOrbitingBodies[infos[0]];
                    this._notificationManager.dispatchLaunchMsg(strings.toText(strings.GameInfos.SPACECRAFT_LAUNCH, [currentBody.getName()]), true);
                    break;

                case astrodynamics.ProblemTypes.MGA1DSM_FLYBY:
                    var infos = transferLeg.mappedFaceID.split('_');
                    var currentBody = this._initialOrbitingBodies[infos[0]];
                    var surfaceType = currentBody.getSurfaceType();
                    switch (surfaceType) {
                    case model.SurfaceTypes.SPHERE:
                        this._notificationManager.dispatchPlanetMsg(strings.toText(strings.GameInfos.FLYBY_RESULT, [currentBody.getName()]));
                        break;
                    case model.SurfaceTypes.TRUNCATED_ICOSAHEDRON:
                        this._notificationManager.dispatchMoonMsg(strings.toText(strings.GameInfos.FACE_MAP_RESULT, [infos[1], currentBody.getName()]));
                        break;
                    }
                    break;

                default:
                    if (this._gameState.getVehicle().isLanded()) {
                        this._notificationManager.dispatchSpacecraftMsg(strings.toText(strings.GameInfos.SPACECRAFT_PARKED, [gameState.getOrbitingBody().getName()]), true);
                    } else {
                        this._notificationManager.dispatchSpacecraftMsg(strings.toText(strings.GameInfos.SPACECRAFT_ORBITING, [gameState.getOrbitingBody().getName()]), true);
                    }
                    break;

                }
            } else {
                if (this._gameState.getVehicle().isLanded()) {
                    this._notificationManager.dispatchSpacecraftMsg(strings.toText(strings.GameInfos.SPACECRAFT_PARKED, [gameState.getOrbitingBody().getName()]), true);
                } else {
                    this._notificationManager.dispatchSpacecraftMsg(strings.toText(strings.GameInfos.SPACECRAFT_ORBITING, [gameState.getOrbitingBody().getName()]), true);
                }
            }
        }
    },

    _setBusy: function () {
        this._busyCounter++;
        if (this._busyCounter) {
            this._busyIndicator.show();
        }
    },

    _unsetBusy: function () {
        this._busyCounter = Math.max(this._busyCounter - 1, 0);
        if (!this._busyCounter) {
            this._busyIndicator.hide();
        }
    },

    _markAndSetScoreForGameState: function (parentGameState, gameState, dsmResult) {
        var reasonIDs = [];
        if (this._funGetTimeUsage(gameState) <= 0) {
            reasonIDs.push(strings.FinalStateReasonIDs.MAX_MISSION_EPOCH);
        }
        if (this._funGetInvalidReasonsForState) {
            reasonIDs.append(this._funGetInvalidReasonsForState(gameState));
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
        if (this._funIsWinningState) {
            if (!gameState.isInvalid()) {
                if (this._funIsWinningState(gameState)) {
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
            if (this._funSetScoreForState) {
                this._funSetScoreForState(gameState);
            }
        }
    },

    _setGameStatePhase: function (gameStatePhase) {
        this._gameStatePhase = gameStatePhase;
        this._dispatchEvent(core.GameEvents.GAME_PHASE_CHANGE, {
            phase: gameStatePhase
        });
    },

    _setGameState: function (gameState) {
        this._setBusy();

        this._orbitingBodyMeshs = [];
        this._userAction.nextOrbitingBody = null;
        this._userAction.nextLeg = {};

        if (this._gameState) {
            var currentBody = this._gameState.getOrbitingBody();
            var transferLeg = this._gameState.getTransferLeg();
            currentBody.onDeactivated();
            for (var id in this._orbitingBodies) {
                var orbBody = this._orbitingBodies[id];
                this._scene.remove(orbBody.getBodyMesh());
                this._scene.remove(orbBody.getOrbitMesh());
            }
            if (transferLeg) {
                this._scene.remove(transferLeg.visualization);
            }
        }
        this._gameState = gameState;

        var epoch = this._gameState.getEpoch();

        var orbitingBodies = this._gameState.getOrbitingBodies();
        this._orbitingBodies = orbitingBodies;
        for (var id in this._orbitingBodies) {
            var orbBody = this._orbitingBodies[id];
            this._scene.add(orbBody.getBodyMesh());
            this._scene.add(orbBody.getOrbitMesh());
            this._orbitingBodyMeshs.push(orbBody.getBodyMesh());
            orbBody.displayAtEpoch(epoch);
            orbBody.reset();
        };

        var transferLeg = this._gameState.getTransferLeg();
        if (transferLeg) {
            this._scene.add(transferLeg.visualization);
        }

        var mappedFaces = this._gameState.getMappedFaces();

        for (var face in mappedFaces) {
            var infos = face.split('_');
            this._initialOrbitingBodies[infos[0]].setFlybyCoords(infos[1], mappedFaces[face], transferLeg.mappedFaceID == face);
        }

        this._gameState.getOrbitingBody().onActivated(epoch, this._gameState.getVehicle());

        this._scoreHUD.update();

        this._unsetBusy();
        if (this._gameState.isInvalid()) {
            var invalidReasons = this._gameState.getInvalidReasonIDs();
            for (var i = 0; i < invalidReasons.length; i++) {
                var id = invalidReasons[i];
                if (id == strings.FinalStateReasonIDs.SPACECRAFT_LIMITATION || id == strings.FinalStateReasonIDs.MAX_TOTAL_DELTAV) {
                    this._notificationManager.dispatchSpacecraftMsg(strings.toText(id), false);
                } else {
                    this._notificationManager.dispatchInvalidMsg(strings.toText(id));
                }
            }
            this._notificationManager.dispatchInfoMsgAt(this._gameHistoryManager.getBackButtonSelector(), strings.toText(strings.GameInfos.FIND_ANOTHER_WAY), false);
            this._setGameStatePhase(core.GameStatePhases.ORBITING_BODY_OVERVIEW_LOCKED);
        } else if (this._gameState.isWinning()) {
            this._notificationManager.dispatchFinishMsg(strings.toText(strings.FinalStateReasonIDs.MISSION_GOAL_ACHIEVED), true);
            this._setGameStatePhase(core.GameStatePhases.ORBITING_BODY_OVERVIEW_LOCKED);
        } else {
            this._setGameStatePhase(core.GameStatePhases.ORBITING_BODY_OVERVIEW);
        }

        this._dispatchEvent(core.GameEvents.GAME_STATE_CHANGE, {
            gameState: this._gameState
        });
    },

    _applySolution: function (solution) {
        var currentGameState = this._gameState;
        var userAction = this._userAction;
        var nextBody = userAction.nextOrbitingBody;
        var chromosome = solution.getChromosome();
        var deltaV = solution.getFitness();
        var currentBody = currentGameState.getOrbitingBody();
        var currentBodies = currentGameState.getOrbitingBodies();
        var vehicle = currentGameState.getVehicle();
        var velocityInf = vehicle.getVelocityInf();
        var score = currentGameState.getScore();
        var totalDeltaV = currentGameState.getTotalDeltaV();
        var epoch = 0;
        var leg = null;
        var timeOfFlight = 0;
        var nextVelocityInf = null;
        var passedDays = 0;
        var transferLeg =  null;
        var flybyResult = null;
        var faceValue = null;
        var dsmResult = null;
        var interactionOption = null;

        switch (userAction.nextLeg.problemType) {
        case astrodynamics.ProblemTypes.MGA1DSM_LAUNCH:
            timeOfFlight = chromosome[5];
            epoch = chromosome[0];
            passedDays = currentGameState.getPassedDays() + epoch - currentGameState.getEpoch();

            transferLeg = {
                problemType: null,
                chromosome: [],
                deltaV: 0,
                gravityLoss: 1,
                timeOfFlight: passedDays,
                mappedFaceID: ''
            };

            var newGameState1 = new core.GameState(currentBodies, currentBody, epoch, passedDays, totalDeltaV, score, vehicle, currentGameState.getMappedFaces(), transferLeg);
            this._markAndSetScoreForGameState(this._gameState, newGameState1);

            flybyResult = currentBody.computeFlybyFaceAndCoords(epoch, velocityInf, chromosome[1], chromosome[2]);
            faceValue = currentBody.getFaceValue(flybyResult.faceID);

            var numStages = vehicle.getStages().length;
            if (numStages > 1) {
                vehicle.jettisonStage();
                this._notificationManager.dispatchJettisonMsg(strings.toText(strings.GameInfos.SPACECRAFT_JETTISON_STAGE, [numStages]));
            }
            dsmResult = vehicle.performManeuver(deltaV, timeOfFlight * utility.DAY_TO_SEC);
            vehicle.setLanded(userAction.nextLeg.performLanding);

            leg = new gui.LaunchLeg(chromosome, currentBody, nextBody);
            leg.setGradient(dsmResult.gravityLoss);

            score += faceValue;
            epoch += timeOfFlight;
            passedDays += timeOfFlight;
            totalDeltaV += deltaV;
            nextVelocityInf = leg.getArrivalVelocityInf();
            vehicle.setVelocityInf(nextVelocityInf);

            transferLeg = {
                problemType: astrodynamics.ProblemTypes.MGA1DSM_LAUNCH,
                chromosome: chromosome,
                deltaV: deltaV,
                timeOfFlight: timeOfFlight,
                visualization: leg,
                gravityLoss: dsmResult.gravityLoss,
                mappedFaceID: currentBody.getID() + '_' + flybyResult.faceID,
                periapsisCoords: flybyResult.coords
            };

            currentBodies = currentGameState.getOrbitingBodies()
            interactionOption = currentBody.getInteractionOption();
            if (interactionOption == core.BodyInteractionOptions.REMOVE_ON_LAUNCH) {
                delete currentBodies[currentBody.getID()];
            }

            var newGameState2 = new core.GameState(currentBodies, nextBody, epoch, passedDays, totalDeltaV, score, vehicle, currentGameState.getMappedFaces(), transferLeg);
            this._markAndSetScoreForGameState(this._gameState, newGameState2, dsmResult);

            this._gameHistoryManager.unlock();
            this._gameHistoryManager.add(newGameState1, true);
            this._gameHistoryManager.add(newGameState2, false);

            this._notificationManager.dispatchLaunchMsg(strings.toText(strings.GameInfos.SPACECRAFT_LAUNCH, [currentBody.getName()]));
            if (vehicle.isLanded()) {
                this._notificationManager.dispatchLandingMsg(strings.toText(strings.GameInfos.SPACECRAFT_LANDING, [nextBody.getName()]));
            }
            break;

        case astrodynamics.ProblemTypes.MGA1DSM_FLYBY:
            timeOfFlight = chromosome[3];
            epoch = currentGameState.getEpoch();
            passedDays = currentGameState.getPassedDays();

            flybyResult = currentBody.computeFlybyFaceAndCoords(epoch, velocityInf, chromosome[0], chromosome[1]);
            faceValue = currentBody.getFaceValue(flybyResult.faceID);

            var numStages = vehicle.getStages().length;
            if (numStages > 1) {
                vehicle.jettisonStage();
                this._notificationManager.dispatchJettisonMsg(strings.toText(strings.GameInfos.SPACECRAFT_JETTISON_STAGE, [numStages]));
            }
            dsmResult = vehicle.performManeuver(deltaV, timeOfFlight * utility.DAY_TO_SEC);
            vehicle.setLanded(userAction.nextLeg.performLanding);

            leg = new gui.FlybyLeg(chromosome, currentBody, nextBody, velocityInf, epoch);
            leg.setGradient(dsmResult.gravityLoss);

            score += faceValue;
            epoch += timeOfFlight;
            passedDays += timeOfFlight;
            totalDeltaV += deltaV;
            nextVelocityInf = leg.getArrivalVelocityInf();
            vehicle.setVelocityInf(nextVelocityInf);

            transferLeg = {
                problemType: astrodynamics.ProblemTypes.MGA1DSM_FLYBY,
                chromosome: chromosome,
                deltaV: deltaV,
                timeOfFlight: timeOfFlight,
                visualization: leg,
                gravityLoss: dsmResult.gravityLoss,
                mappedFaceID: currentBody.getID() + '_' + flybyResult.faceID,
                periapsisCoords: flybyResult.coords
            };

            interactionOption = currentBody.getInteractionOption();
            if (interactionOption == core.BodyInteractionOptions.REMOVE_ON_FLYBY) {
                delete currentBodies[currentBody.getID()];
            }

            var newGameState = new core.GameState(currentBodies, nextBody, epoch, passedDays, totalDeltaV, score, vehicle, currentGameState.getMappedFaces(), transferLeg);
            this._markAndSetScoreForGameState(this._gameState, newGameState, dsmResult);

            this._gameHistoryManager.unlock();
            this._gameHistoryManager.add(newGameState, false);

            var surfaceType = currentBody.getSurfaceType();
            switch (surfaceType) {
            case model.SurfaceTypes.SPHERE:
                this._notificationManager.dispatchPlanetMsg(strings.toText(strings.GameInfos.FLYBY_RESULT, [currentBody.getName()]));
                break;

            case model.SurfaceTypes.TRUNCATED_ICOSAHEDRON:
                if (userAction.faceID != gui.NULL_ID) {
                    if (userAction.faceID != flybyResult.faceID) {
                        this._notificationManager.dispatchMoonMsg(strings.toText(strings.GameInfos.FACE_MAP_RESULT_FAIL, [userAction.faceID, flybyResult.faceID]));
                    } else {
                        this._notificationManager.dispatchMoonMsg(strings.toText(strings.GameInfos.FACE_MAP_RESULT_OK, [flybyResult.faceID]));
                    }
                } else {
                    this._notificationManager.dispatchMoonMsg(strings.toText(strings.GameInfos.FACE_MAP_RESULT, [flybyResult.faceID, currentBody.getName()]));
                }
                break;
            }
            if (vehicle.isLanded()) {
                this._notificationManager.dispatchLandingMsg(strings.toText(strings.GameInfos.SPACECRAFT_LANDING, [nextBody.getName()]));
            }
            break;
        }

        this._dispatchEvent(core.GameEvents.GAME_HISTORY_CHANGE);
        this._setGameState(this._gameHistoryManager.getCurrentGameState());
    },

    _onMouseMove: function (event) {
        this._mousePosition.posX = (event.clientX / window.innerWidth) * 2 - 1;;
        this._mousePosition.posY = -(event.clientY / window.innerHeight) * 2 + 1;
    },

    _onClick: function (event) {

        switch (this._gameStatePhase) {
        case core.GameStatePhases.ORBITING_BODY_OVERVIEW_LOCKED:
            break;

        case core.GameStatePhases.ORBITING_BODY_OVERVIEW:
            var id = this._checkForOrbitingBodyHover();
            if (id != gui.NULL_ID) {
                var currentBody = this._gameState.getOrbitingBody();
                var nextBody = this._orbitingBodies[id];
                if ((currentBody.getInteractionOption() != core.BodyInteractionOptions.NO_ACTION) && (nextBody.getID() == currentBody.getID())) {
                    this._notificationManager.dispatchInfoMsg(strings.toText(strings.GameInfos.SAME_BODY_FORBIDDEN));
                    return;
                }
                this._userAction.nextOrbitingBody = nextBody;
                this._gameHistoryManager.lock();
                nextBody.onSelected();
                nextBody.openConfiguration(this._userAction);
                this._setGameStatePhase(core.GameStatePhases.TRANSFER_CONFIGURATION_NEXT_BODY);
            }
            break;
        }
    },

    _onDblClick: function (event) {
        switch (this._gameStatePhase) {
        case core.GameStatePhases.ORBITING_BODY_OVERVIEW_LOCKED:
            break;

        case core.GameStatePhases.ORBITING_BODY_OVERVIEW:
            var id = this._checkForOrbitingBodyHover();
            if (id != gui.NULL_ID) {
                var currentBody = this._gameState.getOrbitingBody();
                var nextBody = this._orbitingBodies[id];
                if ((currentBody.getInteractionOption() != core.BodyInteractionOptions.NO_ACTION) && (nextBody.getID() == currentBody.getID())) {
                    this._notificationManager.dispatchInfoMsg(strings.toText(strings.GameInfos.SAME_BODY_FORBIDDEN));
                    return;
                }
                this._userAction.nextOrbitingBody = nextBody;
                this._gameHistoryManager.lock();
                nextBody.onSelected();
                nextBody.getDefaultConfiguration(this._userAction);
                this._changeConfigurationMode(core.TransferLegConfigurationModes.DEPARTURE);
                this._gameState.getOrbitingBody().getDefaultConfiguration(this._userAction);
                this._setGameStatePhase(core.GameStatePhases.PROBLEM_PREPARATION);
            }
            break;
        }
    },

    _setupDefaultWorld: function () {
        var missionData = rawdata.defaultMission;
        this._setupWorld(missionData.mission, missionData.saveGame);
    },

    _setupWorld: function (mission, saveGame) {
        var self = this;
        this._setBusy();

        var missionRevision = mission.revision;
        this._dispatchEvent(core.GameEvents.MISSION_REVISION_AVAILABLE, {
            missionRevision: missionRevision
        });

        var maxApoapsis = 0;
        var minPeriapsis = Number.POSITIVE_INFINITY;
        for (var currentBodyID in mission.orbitingBodies) {
            var orbitalElements = mission.orbitingBodies[currentBodyID].orbitalElements;
            maxApoapsis = Math.max(maxApoapsis, orbitalElements.sma * (1 + orbitalElements.ecc));
            minPeriapsis = Math.min(minPeriapsis, orbitalElements.sma * (1 - orbitalElements.ecc));
        }

        gui.POSITION_SCALE = gui.UNIVERSUM_SIZE / (1e2 * maxApoapsis);

        var maxObjectID = mission.centralBody.id;

        this._centralBody = new gui.CentralBody(mission.centralBody.id, mission.centralBody.name, mission.centralBody.sgp, mission.centralBody.radius, mission.centralBody.scale, mission.centralBody.isStar, mission.centralBody.meshMaterialURL);

        this._cameraController.setFocus(this._centralBody);

        this._scene.add(this._centralBody.getBodyMesh());

        this._initialOrbitingBodies = {};
        for (var currentBodyID in mission.orbitingBodies) {
            var id = parseInt(currentBodyID);
            maxObjectID = Math.max(maxObjectID, id);
            var orbitingBodyData = mission.orbitingBodies[currentBodyID];
            var orbitalElements = orbitingBodyData.orbitalElements;
            var orbitalElementDerivatives = orbitingBodyData.orbitalElementDerivatives;

            var orbitingBody = new gui.OrbitingBody(id, orbitingBodyData.name, this._centralBody, orbitalElements, orbitalElementDerivatives, orbitingBodyData.refEpoch, orbitingBodyData.sgp, orbitingBodyData.radius, orbitingBodyData.minRadiusFactor, orbitingBodyData.maxRadiusFactor, orbitingBodyData.maxTimeOfFlight, orbitingBodyData.maxLaunchDelay, orbitingBodyData.arrivalOption, orbitingBodyData.interactionOption, orbitingBodyData.scale, orbitingBodyData.meshMaterialURL, orbitingBodyData.surface);

            this._initialOrbitingBodies[orbitingBody.getID()] = orbitingBody;
        }

        gui.updateIDSeed(maxObjectID + 1);

        var universum = new gui.Universum(gui.UNIVERSUM_SIZE, mission.centralBody.isStar);
        this._scene.add(universum);

        this._cameraController.setMaxRadius(maxApoapsis * 8);
        this._cameraController.setMinRadius(minPeriapsis * 5);

        this._funGetInvalidReasonsForState = mission.funGetInvalidReasonsForState != null ? Function('gameState', mission.funGetInvalidReasonsForState) : null;
        this._funIsWinningState = mission.funIsWinningState != null ? Function('gameState', mission.funIsWinningState) : null;
        this._funSetScoreForState = mission.funSetScoreForState != null ? Function('gameState', mission.funSetScoreForState) : null;

        var maximumMissionDuration = mission.maximumMissionDuration;
        this._funGetTimeUsage = function (gameState) {
            return 1 - gameState.getPassedDays() / maximumMissionDuration;
        };
        this._funGetWinningProgress = Function('gameState', mission.funGetWinningProgress);

        var nodes = saveGame.nodes;
        var nodeHistory = saveGame.nodeHistory;

        var gameStates = {};
        var parents = {};
        var rootNode = null;
        var rootLessNodes = {};
        var node = null;
        for (var id in nodes) {
            node = nodes[id];
            if (node.parentID == null) {
                parents[node.id] = node.id;
                rootNode = node;
            } else {
                parents[node.id] = node.parentID;
                rootLessNodes[node.id] = node;
            }
        }

        var gameStateData = rootNode.gameState;
        var currentBody = this._initialOrbitingBodies[gameStateData.orbitingBodyID];
        var chromosome = null;
        var epoch = gameStateData.epoch;
        var passedDays = 0;
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

        var gameState = new core.GameState(this._initialOrbitingBodies, currentBody, epoch, passedDays, totalDeltaV, score, vehicle, mappedFaces, transferLeg);
        this._markAndSetScoreForGameState(null, gameState, dsmResult);
        gameStates[rootNode.id] = gameState;

        var parentGameState = null;
        var parentVehicle = null;
        var parentBody = null;
        var parentBodies = null;
        var parentScore = 0;
        var parentEpoch = 0;
        var parentPassedDays = 0;
        var parentTotalDeltaV = 0;
        var parentVelocityInf = null;
        var timeOfFlight = 0;
        var deltaV = 0;
        var problemType = null;
        var interactionOption = null;
        var performLanding = false;
        var vehicle = null;
        var leg = null;
        var orbitingBodies = null;

        for (var id in rootLessNodes) {
            parentGameState = gameStates[parents[id]];

            if (parentGameState != null && !parentGameState.isInvalid()) {
                parentBodies = parentGameState.getOrbitingBodies();
                node = rootLessNodes[id];
                gameStateData = node.gameState;
                currentBody = parentBodies[gameStateData.orbitingBodyID];
                if (currentBody != null) {
                    orbitingBodies = parentGameState.getOrbitingBodies();
                    chromosome = gameStateData.transferLeg.chromosome;
                    problemType = gameStateData.transferLeg.problemType;
                    performLanding = gameStateData.transferLeg.performLanding;
                    deltaV = gameStateData.transferLeg.deltaV;
                    timeOfFlight = gameStateData.transferLeg.timeOfFlight;
                    mappedFaces = parentGameState.getMappedFaces();

                    parentBody = parentGameState.getOrbitingBody();
                    parentVehicle = parentGameState.getVehicle();
                    parentScore = parentGameState.getScore();
                    parentEpoch = parentGameState.getEpoch();
                    parentPassedDays = parentGameState.getPassedDays();
                    parentTotalDeltaV = parentGameState.getTotalDeltaV();
                    parentVelocityInf = parentVehicle.getVelocityInf();
                    interactionOption = parentBody.getInteractionOption();

                    leg = null;
                    flybyResult = null;
                    faceValue = 0;
                    switch (problemType) {
                    case astrodynamics.ProblemTypes.MGA1DSM_LAUNCH:
                        leg = new gui.LaunchLeg(chromosome, parentBody, currentBody);
                        flybyResult = parentBody.computeFlybyFaceAndCoords(parentEpoch, parentVelocityInf, chromosome[1], chromosome[2]);
                        faceValue = parentBody.getFaceValue(flybyResult.faceID);
                        if (interactionOption == core.BodyInteractionOptions.REMOVE_ON_LAUNCH) {
                            delete orbitingBodies[parentBody.getID()];
                        }
                        break;
                    case astrodynamics.ProblemTypes.MGA1DSM_FLYBY:
                        leg = new gui.FlybyLeg(chromosome, parentBody, currentBody, parentVelocityInf, parentEpoch);
                        flybyResult = parentBody.computeFlybyFaceAndCoords(parentEpoch, parentVelocityInf, chromosome[0], chromosome[1]);
                        faceValue = parentBody.getFaceValue(flybyResult.faceID);
                        if (interactionOption == core.BodyInteractionOptions.REMOVE_ON_FLYBY) {
                            delete orbitingBodies[parentBody.getID()];
                        }
                        break;
                    }

                    var numStages = parentVehicle.getStages().length;
                    if (numStages > 1 && problemType == astrodynamics.ProblemTypes.MGA1DSM_LAUNCH) {
                        parentVehicle.jettisonStage();
                    }
                    dsmResult = parentVehicle.performManeuver(deltaV, timeOfFlight * utility.DAY_TO_SEC);
                    vehicle = parentVehicle.clone();
                    if (leg) {
                        leg.setGradient(dsmResult.gravityLoss);
                        var nextVelocityInf = leg.getArrivalVelocityInf();
                        vehicle.setVelocityInf(nextVelocityInf);
                        vehicle.setLanded(performLanding);
                    }

                    score = parentScore + faceValue;
                    epoch = parentEpoch + timeOfFlight;
                    passedDays = parentPassedDays + timeOfFlight;
                    totalDeltaV = parentTotalDeltaV + deltaV;

                    var transferLeg = {
                        problemType: problemType,
                        chromosome: chromosome,
                        deltaV: deltaV,
                        timeOfFlight: timeOfFlight,
                        visualization: leg,
                        gravityLoss: dsmResult ? dsmResult.gravityLoss : 1,
                        mappedFaceID: flybyResult != null ? parentBody.getID() + '_' + flybyResult.faceID : '',
                        periapsisCoords: flybyResult != null ? flybyResult.coords : null
                    };

                    gameState = new core.GameState(orbitingBodies, currentBody, epoch, passedDays, totalDeltaV, score, vehicle, mappedFaces, transferLeg);
                    this._markAndSetScoreForGameState(parentGameState, gameState, dsmResult);
                    gameStates[node.id] = gameState;
                }
            }
        }


        var rootNode = new core.HistoryNode(gameStates[rootNode.id], rootNode.id);
        rootNode.setHistorySequenceNr(0);
        var key = rootNode.getKey();
        var maxNodeID = key;
        var jumpTable = {};
        jumpTable[key] = rootNode;

        var newNodeHistory = [key];
        var newNodeHistoryLength = 1;

        for (var i = 1; i < nodeHistory.length; i++) {
            var id = nodeHistory[i];
            var parentNode = jumpTable[parents[id]];
            if (parentNode != null && !parentNode.getValue().isInvalid()) {
                var childNode = parentNode.addChild(gameStates[id], id, nodes[id].isVirtual);
                var childKey = childNode.getKey();
                newNodeHistory.push(childKey);
                childNode.setHistorySequenceNr(newNodeHistoryLength);
                newNodeHistoryLength++;
                jumpTable[childKey] = childNode;
                maxNodeID = Math.max(maxNodeID, childKey);
            }
        }

        datastructure.updateIDSeed(maxNodeID + 1);

        this._gameHistoryManager = new core.GameHistoryManager(rootNode, jumpTable, newNodeHistory);
        this._scoreHUD = new gui.ScoreHUD(this._gameHistoryManager, maximumMissionDuration, this._funGetWinningProgress);
        this._unsetBusy();
        this._setGameState(this._gameHistoryManager.getCurrentGameState());
    },

    _start: function () {
        var self = this;
        window.addEventListener('resize', function () {
            var width = window.innerWidth;
            var height = window.innerHeight;
            self._renderer.setSize(width, height);
            self._camera.aspect = width / height;
            self._camera.updateProjectionMatrix();
        });

        this._cameraController.start();
        this._render();
        this._notificationManager.dispatchInfoMsg(strings.toText(strings.GameInfos.WELCOME));
    },

    registerPlugins: function (plugins) {
        this._plugins = plugins;
    },

    pluginEvent: function (eventType, eventData) {
        switch (eventType) {
        case core.GameEvents.GAME_HISTORY_REQUEST:
            return this._gameHistoryManager.jsonify(eventData.compressed);

        case core.GameEvents.MISSION_ID_AVAILABLE:
            this._dispatchEvent(core.GameEvents.MISSION_ID_AVAILABLE, eventData);
            break;

        case core.GameEvents.MISSION_REVISION_AVAILABLE:
            this._dispatchEvent(core.GameEvents.MISSION_REVISION_AVAILABLE, eventData);
            break;

        case core.GameEvents.MISSION_REVISION_CHANGE:
            this._dispatchEvent(core.GameEvents.MISSION_REVISION_CHANGE, eventData);
            break;

        case core.GameEvents.GAME_ID_CHANGE:
            this._dispatchEvent(core.GameEvents.GAME_ID_CHANGE, eventData);
            break;

        case core.GameEvents.SETUP_GAME:
            this._setupWorld(eventData.mission, eventData.saveGame);
            this._dispatchEvent(core.GameEvents.ENGINE_INITIALIZED);
            this._dispatchEvent(core.GameEvents.GAME_STATE_CHANGE, {
                gameState: this._gameState
            });
            this._start();
            break;

        case core.GameEvents.ORBITING_BODIES_MAPPING_REQUEST:
            var result = {};
            for (var id in this._initialOrbitingBodies) {
                result[id] = this._initialOrbitingBodies[id];
            }
            return result;

        case core.GameEvents.AUTOSAVE_SUCCESS:
            this._dispatchEvent(core.GameEvents.AUTOSAVE_SUCCESS);
            break;

        }
    },

    init: function (gameID) {
        if (gameID) {
            this._dispatchEvent(core.GameEvents.GAME_ID_AVAILABLE, {
                gameID: gameID
            });
        } else {
            this._setupDefaultWorld();
            this._dispatchEvent(core.GameEvents.ENGINE_INITIALIZED);
            this._dispatchEvent(core.GameEvents.GAME_STATE_CHANGE, {
                gameState: this._gameState
            });
            this._start();
        }
    },

    halt: function () {
        cancelAnimationFrame(this._animationFrameID);
    },

    getCamera: function () {
        return this._camera;
    },

    getPluginDomElement: function () {
        return this._scoreHUD.getPluginDomElement();
    },

    getDomElement: function () {
        return this._renderer.domElement;
    }
};