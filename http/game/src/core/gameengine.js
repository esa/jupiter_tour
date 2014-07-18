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

    this._funIsInvalidState = null;
    this._funIsWinningState = null;
    this._funGetTimeUsage = null;
    this._funGetWinningProgress = null;

    this._userAction = {
        nextOrbitingBody: null,
        configuration: {}
    };
    this._scene = new THREE.Scene();
    this._camera = new THREE.PerspectiveCamera(15, window.innerWidth / window.innerHeight, 1, gui.UNIVERSUM_SIZE * 2);
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
    this._orbitingBodyMeshs = [];
    this._maximumMissionDuration = 0;

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

        case core.GameStatePhases.TRANSFER_CONFIGURATION:
            this._hoverOrbitingBodies();

            var orbBody = this._gameState.getOrbitingBody();
            if (!orbBody.isInConfigurationMode()) {
                var configuration = orbBody.getConfiguration();
                if (configuration) {
                    this._userAction.configuration = utility.clone(configuration);
                    this._setGameStatePhase(core.GameStatePhases.ORBITING_BODY_SELECTION);
                } else {
                    this._gameHistoryManager.unlock();
                    this._setGameStatePhase(core.GameStatePhases.ORBITING_BODY_OVERVIEW);
                }
            }
            break;

        case core.GameStatePhases.ORBITING_BODY_SELECTION:
            this._hoverOrbitingBodies();
            break;

        case core.GameStatePhases.SOLVING:
            for (var id in this._orbitingBodies) {
                this._orbitingBodies[id].onMouseOut();
            }

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
            var orbBody = this._orbitingBodies[id];
            var projVec = this._projector.projectVector(orbBody.getPosition().asTHREE().multiplyScalar(gui.POSITION_SCALE), this._camera);
            var screenPosition = new geometry.Vector2((projVec.x + 1) * window.innerWidth / 2, (1 - projVec.y) * window.innerHeight / 2);
            orbBody.update(screenPosition);
        }
        this._cameraController.update();
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
        if (this._gameState != this._gameHistoryManager.getCurrentGameState()) {
            this._notificationManager.clearScreen();
            this._setGameState(this._gameHistoryManager.getCurrentGameState());
            var transferLeg = this._gameState.getTransferLeg();
            if (transferLeg.mappedFaceID != '') {
                var infos = transferLeg.mappedFaceID.split('_');
                var orbBody = this._orbitingBodies[infos[0]];
                var surfaceType = orbBody.getSurfaceType();
                switch (surfaceType) {
                case model.SurfaceTypes.SPHERE:
                    this._notificationManager.dispatchPlanetMsg(strings.toText(strings.GameInfos.FLY_BY_RESULT, [orbBody.getName()]));
                    break;
                case model.SurfaceTypes.TRUNCATED_ICOSAHEDRON:
                    this._notificationManager.dispatchMoonMsg(strings.toText(strings.GameInfos.FACE_MAP_RESULT, [infos[1], orbBody.getName()]));
                    break;
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

    _markIfInvalidGameState: function (gameState, dsmResult) {
        var reasonIDs = [];
        if (this._funGetTimeUsage(gameState) > 1) {
            reasonIDs.push(strings.FinalStateReasonIDs.MAX_MISSION_EPOCH);
        }
        if (this._funIsInvalidState) {
            reasonIDs.concat(this._funIsInvalidState(gameState));
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
    },

    _markIfWinningGameState: function (gameState) {
        if (this._funIsWinningState) {
            if (!gameState.isInvalid()) {
                if (this._funIsWinningState(gameState)) {
                    gameState.markWinning();
                }
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

        this._userAction.nextOrbitingBody = null;
        this._userAction.configuration = {};

        if (this._gameState) {
            var orbBody = this._gameState.getOrbitingBody();
            orbBody.onDeactivated();
            this._scene.remove(this._gameState.getTransferLeg().visualization);
        }
        this._gameState = gameState;

        var epoch = this._gameState.getEpoch();
        for (var id in this._orbitingBodies) {
            var orbBody = this._orbitingBodies[id];
            orbBody.displayAtEpoch(epoch);
            orbBody.reset();
        };

        var transferLeg = this._gameState.getTransferLeg();
        this._scene.add(transferLeg.visualization);

        var mappedFaces = this._gameState.getMappedFaces();

        for (var face in mappedFaces) {
            var infos = face.split('_');
            this._orbitingBodies[infos[0]].setFlybyCoords(infos[1], mappedFaces[face], transferLeg.mappedFaceID == face);
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
        var chromosome = solution.getChromosome();
        var deltaV = solution.getFitness();
        var currentGameState = this._gameState;
        var userAction = this._userAction;
        var currentBody = currentGameState.getOrbitingBody();
        var vehicle = currentGameState.getVehicle();
        var nextBody = userAction.nextOrbitingBody;
        var epoch = 0;
        var score = currentGameState.getScore();
        var leg = null;
        var timeOfFlight = 0;
        var nextVelocityInf = null;
        var passedDays = 0;
        var totalDeltaV = 0;
        var velocityInf = currentGameState.getVehicle().getVelocityInf();
        var transferLeg =  null;
        var flybyResult = null;
        var faceValue = null;
        var dsmResult = null;

        switch (this._userAction.configuration.problemType) {
        case astrodynamics.ProblemTypes.MGA1DSM:
            timeOfFlight = chromosome[5];
            epoch = chromosome[0];
            passedDays = currentGameState.getPassedDays() + epoch - currentGameState.getEpoch();
            totalDeltaV = currentGameState.getTotalDeltaV();

            transferLeg = {
                problemType: null,
                chromosome: [],
                deltaV: 0,
                gravityLoss: 1,
                timeOfFlight: passedDays,
                mappedFaceID: ''
            };
            var newGameState1 = new core.GameState(currentBody, epoch, passedDays, totalDeltaV, score, vehicle, currentGameState.getMappedFaces(), transferLeg);
            this._markIfInvalidGameState(newGameState1);
            this._markIfWinningGameState(newGameState1);

            flybyResult = currentBody.computeFlybyFaceAndCoords(epoch, velocityInf, chromosome[1], chromosome[2]);
            faceValue = currentBody.getFaceValue(flybyResult.faceID);

            dsmResult = vehicle.performManeuver(deltaV, timeOfFlight * utility.DAY_TO_SEC);
            vehicle.setLanded(false);

            leg = new gui.FirstLeg(chromosome, currentBody, nextBody);
            leg.setGradient(dsmResult.gravityLoss);

            score += faceValue;
            totalDeltaV += deltaV;
            epoch += timeOfFlight;
            passedDays += timeOfFlight;
            nextVelocityInf = leg.getArrivingVelocityInf();
            vehicle.setVelocityInf(nextVelocityInf);

            transferLeg = {
                problemType: astrodynamics.ProblemTypes.MGA1DSM,
                chromosome: chromosome,
                deltaV: deltaV,
                timeOfFlight: timeOfFlight,
                visualization: leg,
                gravityLoss: dsmResult.gravityLoss,
                mappedFaceID: currentBody.getID() + '_' + flybyResult.faceID,
                periapsisCoords: flybyResult.coords
            };

            var newGameState2 = new core.GameState(nextBody, epoch, passedDays, totalDeltaV, score, vehicle, currentGameState.getMappedFaces(), transferLeg);
            this._markIfInvalidGameState(newGameState2);
            this._markIfWinningGameState(newGameState2);

            this._gameHistoryManager.unlock();
            this._gameHistoryManager.add(newGameState1);
            this._gameHistoryManager.add(newGameState2);

            break;

        case astrodynamics.ProblemTypes.MGAPART:
            timeOfFlight = chromosome[3];
            epoch = currentGameState.getEpoch();
            passedDays = currentGameState.getPassedDays();

            flybyResult = currentBody.computeFlybyFaceAndCoords(epoch, velocityInf, chromosome[0], chromosome[1]);
            faceValue = currentBody.getFaceValue(flybyResult.faceID);

            dsmResult = vehicle.performManeuver(deltaV, timeOfFlight * utility.DAY_TO_SEC);

            leg = new gui.Leg(chromosome, currentBody, nextBody, velocityInf, epoch);
            leg.setGradient(dsmResult.gravityLoss);

            score += faceValue;
            totalDeltaV += deltaV;
            epoch += timeOfFlight;
            passedDays += timeOfFlight;
            nextVelocityInf = leg.getArrivingVelocityInf();
            vehicle.setVelocityInf(nextVelocityInf);

            var transferLeg = {
                problemType: astrodynamics.ProblemTypes.MGAPART,
                chromosome: chromosome,
                deltaV: deltaV,
                timeOfFlight: timeOfFlight,
                visualization: leg,
                gravityLoss: dsmResult.gravityLoss,
                mappedFaceID: currentBody.getID() + '_' + flybyResult.faceID,
                periapsisCoords: flybyResult.coords
            };

            var newGameState = new core.GameState(nextBody, epoch, passedDays, totalDeltaV, score, vehicle, currentGameState.getMappedFaces(), transferLeg);
            this._markIfInvalidGameState(newGameState, dsmResult);
            this._markIfWinningGameState(newGameState);

            this._gameHistoryManager.unlock();
            this._gameHistoryManager.add(newGameState);

            break;
        }

        var surfaceType = currentBody.getSurfaceType();
        switch (surfaceType) {
        case model.SurfaceTypes.SPHERE:
            this._notificationManager.dispatchPlanetMsg(strings.toText(strings.GameInfos.FLY_BY_RESULT, [currentBody.getName()]));
            break;

        case model.SurfaceTypes.TRUNCATED_ICOSAHEDRON:
            if (userAction.configuration.faceID != gui.NULL_ID) {
                if (userAction.configuration.faceID != flybyResult.faceID) {
                    this._notificationManager.dispatchMoonMsg(strings.toText(strings.GameInfos.FACE_MAP_RESULT_FAIL, [userAction.configuration.faceID, flybyResult.faceID]));
                } else {
                    this._notificationManager.dispatchMoonMsg(strings.toText(strings.GameInfos.FACE_MAP_RESULT_OK, [flybyResult.faceID]));
                }
            } else {
                this._notificationManager.dispatchMoonMsg(strings.toText(strings.GameInfos.FACE_MAP_RESULT, [flybyResult.faceID, currentBody.getName()]));
            }
            break;
        }
        this._setGameState(this._gameHistoryManager.getCurrentGameState());
    },

    _onMouseMove: function (event) {
        this._mousePosition.posX = (event.clientX / window.innerWidth) * 2 - 1;;
        this._mousePosition.posY = -(event.clientY / window.innerHeight) * 2 + 1;
    },

    _onClick: function (event) {
        var orbBody = this._gameState.getOrbitingBody();

        switch (this._gameStatePhase) {
        case core.GameStatePhases.ORBITING_BODY_OVERVIEW_LOCKED:
            break;

        case core.GameStatePhases.ORBITING_BODY_OVERVIEW:
            var id = this._checkForOrbitingBodyHover();
            if (id == orbBody.getID()) {
                this._gameHistoryManager.lock();
                orbBody.openConfigurationWindow();
                this._setGameStatePhase(core.GameStatePhases.TRANSFER_CONFIGURATION);
            }
            break;

        case core.GameStatePhases.ORBITING_BODY_SELECTION:
            var id = this._checkForOrbitingBodyHover();
            if (id != gui.NULL_ID) {
                var nextBody = this._orbitingBodies[id];
                nextBody.onMouseOut();

                this._userAction.nextOrbitingBody = nextBody;

                var problem = null;

                var configuration = this._userAction.configuration;

                switch (configuration.problemType) {
                case astrodynamics.ProblemTypes.MGAPART:
                    problem = new astrodynamics.MGAPart(orbBody, nextBody, this._gameState.getEpoch(), this._gameState.getVehicle().getVelocityInf(), configuration.timeOfFlightBounds, configuration.radiusBounds, configuration.betaBounds);
                    break;

                case astrodynamics.ProblemTypes.MGA1DSM:
                    problem = new astrodynamics.MGA1DSM(orbBody, nextBody, configuration.launchEpochBounds, configuration.velocityBounds, configuration.timeOfFlightBounds);
                    break;
                }

                this._solver = new algorithm.JDE(problem);

                this._setBusy();
                this._setGameStatePhase(core.GameStatePhases.SOLVING);
            }
            break;
        }
    },

    _onDblClick: function (event) {
        var orbBody = this._gameState.getOrbitingBody();

        switch (this._gameStatePhase) {
        case core.GameStatePhases.ORBITING_BODY_OVERVIEW_LOCKED:
            break;

        case core.GameStatePhases.ORBITING_BODY_OVERVIEW:
            var id = this._checkForOrbitingBodyHover();
            if (id != gui.NULL_ID) {
                this._gameHistoryManager.lock();
                var nextBody = this._orbitingBodies[id];
                nextBody.onMouseOut();
                this._userAction.nextOrbitingBody = nextBody;

                var problem = null;

                var configuration = orbBody.getDefaultConfiguration();
                this._userAction.configuration = configuration;

                switch (configuration.problemType) {
                case astrodynamics.ProblemTypes.MGA1DSM:
                    problem = new astrodynamics.MGA1DSM(orbBody, nextBody, configuration.launchEpochBounds, configuration.velocityBounds, configuration.timeOfFlightBounds);
                    break;

                case astrodynamics.ProblemTypes.MGAPART:
                    problem = new astrodynamics.MGAPart(orbBody, nextBody, this._gameState.getEpoch(), this._gameState.getVehicle().getVelocityInf(), configuration.timeOfFlightBounds, configuration.radiusBounds, configuration.betaBounds);
                    break;
                }

                this._solver = new algorithm.JDE(problem);

                this._setBusy();
                this._setGameStatePhase(core.GameStatePhases.SOLVING);
            }
            break;

        case core.GameStatePhases.ORBITING_BODY_SELECTION:
            var id = this._checkForOrbitingBodyHover();
            if (id != gui.NULL_ID) {
                var nextBody = this._orbitingBodies[id];
                nextBody.onMouseOut();
                this._userAction.nextOrbitingBody = nextBody;

                var problem = null;

                var configuration = this._userAction.configuration;

                switch (configuration.problemType) {
                case astrodynamics.ProblemTypes.MGAPART:
                    problem = new astrodynamics.MGAPart(orbBody, nextBody, this._gameState.getEpoch(), this._gameState.getVehicle().getVelocityInf(), configuration.timeOfFlightBounds, configuration.radiusBounds, configuration.betaBounds);
                    break;

                case astrodynamics.ProblemTypes.MGA1DSM:
                    problem = new astrodynamics.MGA1DSM(orbBody, nextBody, configuration.launchEpochBounds, configuration.velocityBounds, configuration.timeOfFlightBounds);
                    break;
                }

                this._solver = new algorithm.JDE(problem);

                this._setBusy();
                this._setGameStatePhase(core.GameStatePhases.SOLVING);
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

        var maxApoapsis = 0;
        var minPeriapsis = Number.POSITIVE_INFINITY;
        for (var orbBodyID in mission.orbitingBodies) {
            var orbitalElements = mission.orbitingBodies[orbBodyID].orbitalElements;
            maxApoapsis = Math.max(maxApoapsis, orbitalElements.sma * (1 + orbitalElements.ecc));
            minPeriapsis = Math.min(minPeriapsis, orbitalElements.sma * (1 - orbitalElements.ecc));
        }

        gui.POSITION_SCALE = gui.UNIVERSUM_SIZE / (1e2 * maxApoapsis);

        var maxObjectID = mission.centralBody.id;

        this._centralBody = new gui.CentralBody(mission.centralBody.id, mission.centralBody.name, mission.centralBody.sgp, mission.centralBody.radius, mission.centralBody.scale, mission.centralBody.isStar, mission.centralBody.meshMaterialURL);

        this._cameraController.setFocus(this._centralBody);

        this._scene.add(this._centralBody.getBodyMesh());

        for (var orbBodyID in mission.orbitingBodies) {
            var id = parseInt(orbBodyID);
            maxObjectID = Math.max(maxObjectID, id);
            var orbitingBodyData = mission.orbitingBodies[orbBodyID];
            var orbitalElements = orbitingBodyData.orbitalElements;
            var orbitalElementDerivatives = orbitingBodyData.orbitalElementDerivatives;

            var orbitingBody = new gui.OrbitingBody(id, orbitingBodyData.name, this._centralBody, orbitalElements, orbitalElementDerivatives, orbitingBodyData.refEpoch, orbitingBodyData.sgp, orbitingBodyData.radius, orbitingBodyData.minRadiusFactor, orbitingBodyData.maxRadiusFactor, orbitingBodyData.maxTimeOfFlight, orbitingBodyData.maxLaunchDelay, orbitingBodyData.scale, orbitingBodyData.meshMaterialURL, orbitingBodyData.surface);

            this._orbitingBodies[orbitingBody.getID()] = orbitingBody;
            this._orbitingBodyMeshs.push(orbitingBody.getBodyMesh());
            this._scene.add(orbitingBody.getOrbitMesh());
            this._scene.add(orbitingBody.getBodyMesh());
        }

        gui.updateIDSeed(maxObjectID + 1);

        var universum = new gui.Universum(gui.UNIVERSUM_SIZE, mission.centralBody.isStar);
        this._scene.add(universum);

        this._cameraController.setMaxRadius(maxApoapsis * 8);
        this._cameraController.setMinRadius(minPeriapsis * 5);

        this._funIsInvalidState = Function('gameState', mission.funIsInvalidState);
        this._funIsWinningState = Function('gameState', mission.funIsWinningState);

        this._maximumMissionDuration = mission.maximumMissionDuration;
        this._funGetTimeUsage = function (gameState) {
            return gameState.getPassedDays() / self._maximumMissionDuration;
        };
        this._funGetWinningProgress = Function('gameState', mission.funGetWinningProgress);

        var nodes = saveGame.nodes;
        var nodeHistory = saveGame.nodeHistory;

        var gameStates = {};
        var parents = {};
        var rootID = null;
        var maxNodeID = 0;
        for (var id in nodes) {
            var node = nodes[id];
            maxNodeID = Math.max(maxNodeID, node.id);
            if (node.parentID == null) {
                parents[node.id] = node.id;
            } else {
                parents[node.id] = node.parentID;
            }
        }

        for (var id in nodes) {
            var node = nodes[id];
            var gameState = node.gameState;
            var currentBody = this._orbitingBodies[gameState.orbitingBodyID];
            var previousNode = null;
            var previousOBody = null;
            if (node.parentID != null) {
                previousNode = nodes[parents[node.id]];
                previousOBody = this._orbitingBodies[previousNode.gameState.orbitingBodyID];
            }
            var chromosome = gameState.transferLeg.chromosome;
            var epoch = gameState.epoch;
            var passedDays = gameState.passedDays;
            var deltaV = gameState.transferLeg.deltaV;
            var problemType = gameState.transferLeg.problemType;
            var timeOfFlight = gameState.transferLeg.timeOfFlight;
            var totalDeltaV = gameState.totalDeltaV;
            var score = gameState.score;

            var stages = [];
            var vehicleData = gameState.vehicle;
            for (var i = 0; i < vehicleData.stages.length; i++) {
                var stage = vehicleData.stages[i];
                stages.push(new model.Stage(stage.propulsionType, stage.mass, stage.emptyMass, stage.thrust, stage.specificImpulse));
            }
            var vehicle = new model.Vehicle(new geometry.Vector3().fromArray(gameState.vehicle.velocityInf), stages, gameState.vehicle.isLanded);

            var dsmResult = null;
            if (node.parentID != null) {
                dsmResult = gameStates[node.parentID].getVehicle().performManeuver(deltaV, timeOfFlight * utility.DAY_TO_SEC);
            }

            var leg = null;
            if (node.parentID != null) {
                switch (problemType) {
                case astrodynamics.ProblemTypes.MGA1DSM:
                    leg = new gui.FirstLeg(chromosome, previousOBody, currentBody);
                    leg.setGradient(dsmResult.gravityLoss);
                    break;
                case astrodynamics.ProblemTypes.MGAPART:
                    leg = new gui.Leg(chromosome, previousOBody, currentBody, new geometry.Vector3().fromArray(previousNode.gameState.vehicle.velocityInf), previousNode.gameState.epoch);
                    leg.setGradient(dsmResult.gravityLoss);
                }
            }
            var mappedFaceID = gameState.transferLeg.mappedFaceID;
            var mappedFaces = {};
            for (var faceID in gameState.mappedFaces) {
                for (var i = 0; i < gameState.mappedFaces[faceID].length; i++) {
                    if (mappedFaces[faceID]) {
                        mappedFaces[faceID].push(new geometry.Vector2().fromArray(gameState.mappedFaces[faceID][i]));
                    } else {
                        mappedFaces[faceID] = [new geometry.Vector2().fromArray(gameState.mappedFaces[faceID][i])];
                    }
                }
            }

            var transferLeg = {
                problemType: problemType,
                chromosome: chromosome,
                deltaV: deltaV,
                timeOfFlight: timeOfFlight,
                visualization: leg,
                gravityLoss: dsmResult ? dsmResult.gravityLoss : 1,
                mappedFaceID: mappedFaceID
            };

            var gameState = new core.GameState(currentBody, epoch, passedDays, totalDeltaV, score, vehicle, mappedFaces, transferLeg);

            this._markIfInvalidGameState(gameState, dsmResult);
            this._markIfWinningGameState(gameState);

            gameStates[node.id] = gameState;

            if (node.parentID == null) {
                rootID = node.id;
            }
        }

        var rootNode = new core.HistoryNode(gameStates[rootID], rootID);
        rootNode.setHistorySequenceNr(0);
        var key = rootNode.getKey();
        var jumpTable = {};
        jumpTable[key] = rootNode;

        for (var i = 1; i < nodeHistory.length; i++) {
            var id = nodeHistory[i];
            var parentNode = jumpTable[parents[id]];
            var childNode = parentNode.addChild(gameStates[id], id);
            childNode.setHistorySequenceNr(i);
            var childKey = childNode.getKey();
            jumpTable[childKey] = childNode;
        }

        datastructure.updateIDSeed(maxNodeID + 1);

        this._gameHistoryManager = new core.GameHistoryManager(rootNode, jumpTable, nodeHistory);
        this._scoreHUD = new gui.ScoreHUD(this._gameHistoryManager, {
            funGetWinningProgress: this._funGetWinningProgress,
            funGetTimeUsage: this._funGetTimeUsage
        });
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
            return this._orbitingBodies;
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
    },

    onViewChange: function (viewDistance) {
        for (var id in this._orbitingBodies) {
            this._orbitingBodies[id].onViewChange(viewDistance);
        }
    }
};