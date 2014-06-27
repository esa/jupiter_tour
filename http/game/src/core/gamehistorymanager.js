/* Class GameHistoryManager
    Basically manipulates a tree of all gamestates and an array of all ids of nodes in order of traversal. Additionally it contains a jumptable to jump from node to node in the tree.
    Handles the D3JS GUI Tree.
*/
core.GameHistoryManager = function (rootNode, jumpTable, nodeHistory) {
    this._isLocked = false;
    this._rootNode = rootNode;
    if (jumpTable && nodeHistory) {
        this._jumpTable = jumpTable;
        this._nodeHistory = nodeHistory;
    } else {
        this._jumpTable = {};
        this._jumpTable[this._rootNode.getKey()] = this._rootNode;
        this._nodeHistory = [this._rootNode.getKey()];
        this._rootNode.setHistorySequenceNr(0);
    }
    this._historyPointer = this._nodeHistory.length - 1;
    this._currentNode = this._jumpTable[this._nodeHistory[this._historyPointer]];
    this._historyHUD = new gui.GameHistoryHUD(this);
    this._historyHUD.onActiveChanged(this._currentNode.getKey());
};
core.GameHistoryManager.prototype = {
    constructor: core.GameHistoryManager,

    _d3jsify: function (node) {
        var gameState = node.getValue();
        var transferLeg = gameState.getTransferLeg();
        var childs = node.getChilds();
        var id = node.getKey();
        var parent = node.getParent();
        var name = gameState.getOrbitingBody().getName();
        var dsmRating = transferLeg.dsmRating;
        var passedDays = gameState.getPassedDays();
        var totalDeltaV = gameState.getTotalDeltaV();
        var score = gameState.getScore();
        var isCurrentState = (node.getKey() == this._currentNode.getKey());

        var result = {};
        result.id = id;
        result.parentID = (parent ? parent.getKey() : null);
        result.hasHiddenSiblings = false;
        result.properties = {};
        result.properties.name = name;
        result.properties.dsmRating = dsmRating;
        result.properties.passedDays = passedDays;
        result.properties.totalDeltaV = totalDeltaV;
        result.properties.score = score;
        result.properties.isCurrentState = isCurrentState;
        result.children = [];
        for (var key in childs) {
            var child = childs[key];
            var childResult = this._d3jsify(child);
            result.children.push(childResult);
        }
        return result;
    },

    add: function (gameState) {
        if (!this._isLocked) {
            var currentNode = this._currentNode;
            var nextNode = this._currentNode.addChild(gameState);
            this._currentNode = nextNode;
            this._nodeHistory.push(this._currentNode.getKey());
            nextNode.setHistorySequenceNr(this._nodeHistory.length - 1);
            this._jumpTable[this._currentNode.getKey()] = this._currentNode;
            this._historyPointer = this._nodeHistory.length - 1;

            this._historyHUD.add(currentNode.getKey(), nextNode.getKey(), {
                name: gameState.getOrbitingBody().getName(),
                dsmRating: gameState.getTransferLeg().dsmRating,
                passedDays: gameState.getPassedDays(),
                totalDeltaV: gameState.getTotalDeltaV(),
                score: gameState.getScore()
            });
        }
    },

    getCurrentGameState: function () {
        return this._currentNode.getValue();
    },

    goTo: function (nodeID) {
        if (!this._isLocked) {
            this._currentNode = this._jumpTable[nodeID];
            this._historyPointer = this._currentNode.getHistorySequenceNr();
            this._historyHUD.onActiveChanged(nodeID);
        }
    },

    goToPrevious: function () {
        if (!this._isLocked) {
            var parentNode = this._currentNode.getParent();
            if (parentNode) {
                this._currentNode = parentNode;
                this._historyPointer = this._currentNode.getHistorySequenceNr();
                this._historyHUD.onActiveChanged(this._currentNode.getKey());
            }
        }
    },

    rewindStep: function () {
        if (!this._isLocked) {
            if (this._historyPointer > 0) {
                this._historyPointer--;
                this.goTo(this._nodeHistory[this._historyPointer]);
            }
        }
    },

    forwardStep: function () {
        if (!this._isLocked) {
            if (this._historyPointer + 1 < this._nodeHistory.length) {
                this._historyPointer++;
                this.goTo(this._nodeHistory[this._historyPointer]);
            }
        }
    },

    size: function () {
        return Object.keys(this._jumpTable).length;
    },

    lock: function () {
        this._historyHUD.lock();
        this._isLocked = true;
    },

    unlock: function () {
        this._historyHUD.unlock();
        this._isLocked = false;
    },

    isLocked: function () {
        return this._isLocked;
    },

    getBackButtonSelector: function () {
        return this._historyHUD.getBackButtonSelector();
    },

    d3jsify: function () {
        return this._d3jsify(this._rootNode);
    },

    jsonify: function (compressed) {
        var result = {};
        result.nodeHistory = this._nodeHistory.clone();
        var nodes = {};
        algorithm.bfs(this._rootNode, function (node) {
                return node.getKey();
            },
            function (node) {
                var arrChilds = [];
                var childs = node.getChilds();
                for (var key in childs) {
                    arrChilds.push(childs[key]);
                }
                return arrChilds;
            },
            function (node) {
                var gameState = node.getValue();
                var transferLeg = gameState.getTransferLeg();
                var id = node.getKey();
                var parent = node.getParent();

                var nodeResult = {};
                nodeResult.id = id;
                nodeResult.parentID = (parent ? parent.getKey() : null);
                nodeResult.gameState = {};
                nodeResult.gameState.transferLeg = {};
                nodeResult.gameState.transferLeg.chromosome = transferLeg.chromosome;
                if (!compressed) {
                    var dsmRating = transferLeg.dsmRating;
                    var problemType = transferLeg.problemType;
                    var timeOfFlight = transferLeg.timeOfFlight;
                    var orbitingBodyID = gameState.getOrbitingBody().getID();
                    var passedDays = gameState.getPassedDays();
                    var totalDeltaV = gameState.getTotalDeltaV();
                    var deltaV = transferLeg.deltaV;
                    var score = gameState.getScore();
                    var epoch = gameState.getEpoch();
                    var velocityInf = gameState.getVelocityInf();
                    var mappedFaceID = transferLeg.mappedFaceID;
                    var isRoot = gameState.isRoot();
                    var invalidReasonIDs = gameState.getInvalidReasonIDs();
                    var mappedFaces = gameState.getMappedFaces();
                    var isWinning = gameState.isWinning();

                    var spacecraft = gameState.getSpacecraft();
                    var specificImpulse = spacecraft.getSpecificImpulse();
                    var maxThrust = spacecraft.getMaxThrust();
                    var mass = spacecraft.getMass();
                    var emptyMass = spacecraft.getEmptyMass();
                    var isLanded = spacecraft.isLanded();

                    nodeResult.gameState.orbitingBodyID = orbitingBodyID;
                    nodeResult.gameState.epoch = epoch;
                    nodeResult.gameState.transferLeg.dsmRating = dsmRating;
                    nodeResult.gameState.transferLeg.mappedFaceID = mappedFaceID;
                    nodeResult.gameState.transferLeg.deltaV = deltaV;
                    nodeResult.gameState.transferLeg.problemType = problemType;
                    nodeResult.gameState.transferLeg.timeOfFlight = timeOfFlight;
                    nodeResult.gameState.passedDays = passedDays;
                    nodeResult.gameState.totalDeltaV = totalDeltaV;
                    nodeResult.gameState.score = score;
                    nodeResult.gameState.velocityInf = velocityInf.asArray();
                    nodeResult.gameState.isRoot = isRoot;
                    nodeResult.gameState.isWinning = isWinning;
                    nodeResult.gameState.invalidReasonIDs = invalidReasonIDs;
                    nodeResult.gameState.spacecraft = {};
                    nodeResult.gameState.spacecraft.specificImpulse = specificImpulse;
                    nodeResult.gameState.spacecraft.maxThrust = maxThrust;
                    nodeResult.gameState.spacecraft.mass = mass;
                    nodeResult.gameState.spacecraft.emptyMass = emptyMass;
                    nodeResult.gameState.spacecraft.isLanded = isLanded;
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
            });
        result.nodes = nodes;
        return result;
    }
};