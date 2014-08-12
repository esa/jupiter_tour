/* HTTP-Server for the Jupiter Tour Game.
    Includes Session-Management, Data retreival and user authorization.
    
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
*/

// Convenient stuff
String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

var Server = {};

(function () {
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



    // Server Configuration
    var SESSION_TIMEOUT = 30 * 60;
    var VERBOSE = true;
    var PORT = 8081;
    var ENABLE_HTTPS = false;
    var SESSION_ID_LENGTH = 48;
    var SESSION_CLEANING_INTERVAL = 5 * 60;
    var SCOREBOARD_REFRESH_INTERVAL = 1 * 60 * 60;
    var FILE_CACHING_TIME = 0 * 24 * 60 * 60;
    var DATABASE_NAME = 'jupitertour';

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
        log('HTTP: Starting server...', true);
        httpServer.listen(PORT, function () {
            if (ENABLE_HTTPS) {
                log('HTTP: SSL/TLS server listening on port ' + PORT + '.', true);
            } else {
                log('HTTP: Server listening on port ' + PORT + '.', true);
            }
            mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/' + DATABASE_NAME, function (error, database) {
                if (error) {
                    throw error;
                } else {
                    log('DB: Connection opened.', true);
                    dbConnection = database;
                    periodicSessionCleaning();
                    setInterval(periodicSessionCleaning, SESSION_CLEANING_INTERVAL * 1000);
                    periodicScoreboardRefresh();
                    setInterval(periodicScoreboardRefresh, SCOREBOARD_REFRESH_INTERVAL * 1000);
                }
            });
        });
    }

    function stop() {
        if (dbConnection) {
            dbConnection.close();
            log('DB: Connection closed.', true);
        }
        log('Stopping server...', true);
        httpServer.close(function () {
            log('HTTP: Server down.', true);
        });
    }

    function log(message, ignoreQuiet) {
        if (VERBOSE || ignoreQuiet) {
            console.log(message);
        }
    }

    function getMission(missionID) {
        var localPath = './missions/mission' + missionID + '.json';
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

        log('DB: Scoreboard refresh finish @ ' + new Date());
    }

    function checkAndAppendDeltaData(saveGameRecord, deltaData, callback) {
        //TODO: Implement!
        if (saveGameRecord == null) {
            callback(deltaData);
            log('DB: Checked savegame data for correctness.');
        } else {

        }
    }

    function updateSession(session, date) {
        if (session) {
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
            });
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
                    checkAndAppendDeltaData(null, deltaData, function (checkedSaveGame) {
                        record = {
                            userID: user._id,
                            data: {
                                nodes: checkedSaveGame.nodes,
                                nodeHistory: checkedSaveGame.nodeHistory
                            },
                            name: name,
                            submission: date,
                            missionID: missionID,
                            missionRevision: missionRevision,
                            deltaIndex: checkedSaveGame.nodeHistory.length
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
                checkAndAppendDeltaData(null, deltaData, function (checkedSaveGame) {
                    var record = {
                        userID: (user ? user._id : null),
                        data: {
                            nodes: checkedSaveGame.nodes,
                            nodeHistory: checkedSaveGame.nodeHistory
                        },
                        name: name,
                        submission: date,
                        missionID: missionID,
                        missionRevision: missionRevision,
                        deltaIndex: checkedSaveGame.nodeHistory.length
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
                        missionID: missionID != null ? missionID : record.missionID,
                        userID: user._id
                    };
                    saveGames.findOne(query, function (error, existingRecord) {
                        if (error || existingRecord) {
                            callback(null);
                            return;
                        }
                        if (deltaIndex == record.deltaIndex && missionRevision == record.missionRevision) {
                            checkAndAppendDeltaData(record, deltaData, function (checkedSaveGame) {
                                record.data.nodes = checkedSaveGame.nodes;
                                record.data.nodeHistory = checkedSaveGame.nodeHistory;
                                record.name = name != null ? name : record.name;
                                record.deltaIndex = record.data.nodeHistory.length;
                                record.submission = date;

                                deleteRecordIfEmpty(saveGames, record, callback);
                            });
                        } else {
                            checkAndAppendDeltaData(record, deltaData, function (checkedSaveGame) {
                                record.data = checkedSaveGame;
                                record.name = name;
                                record.submission = date;
                                record.missionID = missionID != null ? missionID : record.missionID;
                                record.missionRevision = missionRevision;
                                record.deltaIndex = deltaData.nodeHistory.length;

                                deleteRecordIfEmpty(saveGames, record, callback);
                            });
                        }

                    });
                } else {
                    if (deltaIndex == record.deltaIndex && missionRevision == record.missionRevision) {
                        checkAndAppendDeltaData(record, deltaData, function (checkedSaveGame) {
                            record.data.nodes = checkedSaveGame.nodes;
                            record.data.nodeHistory = checkedSaveGame.nodeHistory;
                            record.name = name != null ? name : record.name;
                            record.deltaIndex = record.data.nodeHistory.length;
                            record.submission = date;

                            deleteRecordIfEmpty(saveGames, record, callback);
                        });
                    } else {
                        checkAndAppendDeltaData(record, deltaData, function (checkedSaveGame) {
                            record.data = checkedSaveGame;
                            record.name = name;
                            record.submission = date;
                            record.missionID = missionID != null ? missionID : record.missionID;
                            record.missionRevision = missionRevision;
                            record.deltaIndex = deltaData.nodeHistory.length;

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

    function isParetoDominant(score1, score2) {
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
    }

    function addOrUpdateScore(user, saveGame, callback) {
        if (user && saveGame) {
            var nodes = saveGame.data.nodes;
            if (nodes) {
                var bestScore = null;
                for (var id in nodes) {
                    var node = nodes[id];
                    var gameState = node.gameState;
                    var score = {};
                    score.score = gameState.score;
                    score.totalDeltaV = gameState.totalDeltaV;
                    score.passedDays = gameState.passedDays;
                    if (bestScore) {
                        if (isParetoDominant(score, bestScore)) {
                            bestScore =  score;
                        }
                    } else {
                        bestScore = score;
                    }
                }
                if (bestScore && bestScore.score != 0) {
                    var scores = dbConnection.collection('scores');
                    var query = {
                        userID: user._id,
                        missionID: saveGame.missionID
                    };
                    scores.findOne(query, function (error, score) {
                        if (error) {
                            callback(null);
                            return;
                        }
                        if (score) {
                            if (isParetoDominant(bestScore, score)) {
                                score.score = bestScore.score;
                                score.totalDeltaV = bestScore.totalDeltaV;
                                score.passedDays = bestScore.passedDays;

                                scores.save(score, function (error) {
                                    if (error) {
                                        callback(null);
                                        return;
                                    }
                                    log('DB: New state for highscore by user ' + user.name);
                                    callback(score);
                                });
                            } else {
                                callback(score);
                            }
                        } else {
                            var score = {
                                userID: user._id,
                                score: bestScore.score,
                                totalDeltaV: bestScore.totalDeltaV,
                                passedDays: bestScore.passedDays,
                                missionID: saveGame.missionID
                            };
                            scores.insert(score, function (error, records) {
                                if (error) {
                                    callback(null);
                                    return;
                                }
                                log('DB: New state for highscore by user ' + user.name);
                                callback(records[0]);
                            });
                        }
                    });
                } else {
                    callback(null);
                }
            } else {
                callback(null);
            }
        } else {
            callback(null);
        }
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

    function saveGameListToHTML(records) {
        var htmlText = '<ul>';
        if (records) {
            records.forEach(function (record) {
                htmlText += "\n" + '<li id="' + record._id.toHexString() + '" class="savegame-entry"><div class="name text-fit">' + record.name + '</div><div class="tip text-fit"> (mission ' + record.missionID + ')</div></li>';
            });
        }
        htmlText += "\n" + '</ul>';
        return htmlText;
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
                    response.redirect('/dashboard/index.html');
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
                                        sendSuccessResponse(response);
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
                if ((deltaData != null) && (deltaIndex != null) && (gameID != null) && (missionRevision != null)) {
                    gameID = new mongodb.ObjectID.createFromHexString(gameID);
                    missionID = missionID != null ? parseInt(missionID) : null;
                    name = name != null ? escape(name) : null;
                    deltaData = JSON.parse(deltaData);
                    deltaIndex = parseInt(deltaIndex);
                    updateSaveGame(gameID, user, missionID, parseInt(missionRevision), name, deltaData, deltaIndex, now, function (saveGame) {
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
            var result = 'id,username,score,totalDeltaV,passedDays' + "\n";
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
                                result += score._id.toHexString() + ',' + user.name + ',' + score.score + ',' + score.totalDeltaV + ',' + score.passedDays + "\n";
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
        default:
            sendErrorResponse(response, 400);
            break;
        }
    }


    // Exposed Interface:
    Server.start = start;
    Server.stop = stop;
})();

Server.start();
/*
setTimeout(function () {
    oServer.stop();
}, 10000);
*/