var socketio = require('socket.io');
var _ = require('underscore');
var async = require('async');
var sessionMiddleware = require('../lib/module/sessionMiddleware');
var User = require('../lib/model/user');
var Game = require('../lib/model/game');
var userStatus = require('../lib/model/userStatus');
var ObjectId = require('mongoose').Schema.ObjectId;

module.exports = function (server) {
    var io = socketio.listen(server);
    var users = {}; // 接続しているユーザ情報
    var lobbyId = '0000';
    var sockets = {}; // ソケット群 (key: username)

    io.use(function (socket, next) {
        sessionMiddleware(socket.request, {}, next);
    });

    // 接続時
    io.sockets.on('connection', function (socket) {
        console.log('new connected: ' + socket.id);

        var user = {
            info: !socket.request.session ? null :
                !socket.request.session.passport ? null :
                    socket.request.session.passport.user
        };

        users[socket.id] = user;

        // ログインしていなかったら接続を切る
        if (!checkAuth(socket, function (message) { socket.disconnect(message); })) {
            return;
        }

        user.id = user.info.doc._id;
        user.name = user.info.username;
        sockets[user.name] = socket;

        // 接続したらユーザのステータスを初期化する
        User.findOneAndUpdate({name: user.name}, {
            status: userStatus.login,
            gameId: null,
            roomId: null
        }, function (err) {
            if (err) {
                console.error(err);
                socket.disconnect(err);
            }
        });

        /***** イベント登録 *****/

        // ロビーに入る
        socket.on('join-lobby', function (req, fn) {
            fn = fn || function () {};

            async.series([
                leaveRoom.bind(this, socket, user),
                joinLobbyRoom.bind(this, socket, user),
                User.find.bind(User, {roomId: lobbyId})
            ], function (err, results) {
                if (err) { serverErrorWrap(err, {}, fn); return; }

                var user = results[1];
                var users = results[2];
                successWrap('joined lobby', {
                    roomId: user.roomId,
                    roomType: roomTypeById(user.roomId),
                    users: users
                }, fn);
            });
        });

        // ゲームルームを作って誰かをゲームに誘う
        socket.on('call-game', function (req, fn) {
            req = req || {};
            fn = fn || function () {};

            if (!req.targetUsername) {
                userErrorWrap('invalid params: required targetUsername', req, fn);
                return;
            }

            if (!sockets[req.targetUsername]) {
                userErrorWrap('invalid params: not found targetUsername', req, fn);
                return;
            }

            async.waterfall([
                Game.create.bind(Game, {}),
                function (game, callback) {
                    var gameId = game._id;

                    async.series([
                        leaveRoom.bind(this, socket, user),
                        joinGameRoom.bind(this, socket, user, gameId),
                        callGameRoom.bind(this, user.name, req.targetUsername, gameId)
                    ], function (err, results) {
                        if (err) { callback(err); return; }

                        var user = results[1];
                        callback(null, game, user);
                    });
                }
            ], function (err, game, user) {
                if (err) { serverErrorWrap(err, {}, fn); return; }

                successWrap('joined game room', {
                    game: game,
                    users: [user],
                    roomId: user.roomId,
                    roomType: roomTypeById(user.roomId)
                }, fn);
            });
        });

        // ゲームに参加する
        socket.on('join-game', function (req, fn) {
            req = req || {};
            fn = fn || function () {};

            if (!req.gameId) {
                userErrorWrap('invalid params: required gameId', req, fn);
            }

            async.waterfall([
                Game.findById.bind(Game, req.gameId),
                function (game, callback) {
                    if (!game) {
                        userErrorWrap('invalid params: not found gameId', req, fn);
                        return;
                    }

                    var gameId = game._id;

                    async.series([
                        leaveRoom.bind(this, socket, user),
                        joinGameRoom.bind(this, socket, user, gameId),
                        User.find.bind(User, {roomId: String(gameId)})
                    ], function (err, results) {
                        if (err) { callback(err); return; }

                        var user = results[1];
                        var users = results[2];
                        callback(null, game, user, users);
                    });
                }
            ], function (err, game, user, users) {
                if (err) { serverErrorWrap(err, {}, fn); return; }

                successWrap('joined game room', {
                    game: game,
                    users: users,
                    roomId: user.roomId,
                    roomType: roomTypeById(user.roomId)
                }, fn);
            });
        });

        // ゲームを開始する
        socket.on('start-game', function (req, fn) {
            req = req || {};
            fn = fn || function () {};

            req.gameLimitSeconds = req.gameLimitSeconds || 5 * 1000;
            req.delaySeconds = req.delaySeconds || 20;

            async.waterfall([ // get users
                User.findById.bind(User, user.id),
                function (user, callback) {
                    var gameId = user.gameId;
                    var roomId = user.roomId;
                    var roomType = roomTypeById(user.roomId);

                    if (!gameId || !roomId || roomType !== 'game') {
                        userErrorWrap('must be in game room', {gameId: gameId, roomId: roomId, roomType: roomType}, fn);
                        return;
                    }

                    callback(null, user);
                },
                function (user, callback) {
                    User.find({status: userStatus.playing, gameId: user.gameId}, callback);
                },
                function (users, callback) {
                    if (users.length < 2) {
                        userErrorWrap('user length must be equals 2 in same game room', {users: users}, fn);
                        return;
                    }

                    startGame(socket, users, users[0].gameId, req.gameLimitSeconds, req.delaySeconds, callback);
                }
            ], function (err, game) {
                if (err) { serverErrorWrap(err); return; }
                successWrap('game start!', {game: game}, fn);
            });
        });

        // 切断
        socket.on('disconnect', function () {
            console.log('disconnected: ' + socket.id);

            async.series([
                leaveRoom.bind(this, socket, user),
                User.updateStatus.bind(User, user.name, userStatus.logout)
            ], function (err) {
                if (err) { console.error(err); }

                delete users[socket.id];
                delete sockets[user.name];
            });
        });
    });

    /**** emitter and method *****/

    function joinLobbyRoom(socket, user, callback) {
        User.findOneAndUpdate({name: user.name}, {
            status: userStatus.lobby,
            gameId: null,
            roomId: lobbyId
        }, function (err, user) {
            if (err) { callback(err); return; }

            socket.join(lobbyId);
            io.to(lobbyId).emit('join-room', {
                username: user.name,
                roomId: lobbyId,
                roomType: roomTypeById(lobbyId)
            });

            callback(null, user);
        });
    }

    function leaveRoom(socket, user, callback) {
        // ユーザが見つからない場合はスルー
        if (!user) { callback(null); return; }

        User.findOneAndUpdate({name: user.name}, {
            status: userStatus.login,
            gameId: null,
            roomId: null
        }, function (err, user) {
            if (err) { callback(err); return; }

            if (user.roomId) {
                socket.leave(user.roomId);
                io.to(user.roomId).emit('leave-room', {
                    username: user.name,
                    roomId: user.roomId,
                    roomType: roomTypeById(user.roomId)
                });
            }

            callback(null, user);
        });
    }

    function joinGameRoom(socket, user, gameId, callback) {
        User.findOneAndUpdate({name: user.name}, {
            status: userStatus.playing,
            gameId: gameId,
            roomId: String(gameId)
        }, function (err, user) {
            if (err) { callback(err); return; }

            socket.join(user.roomId);
            io.to(user.roomId).emit('join-room', {
                username: user.name,
                roomId: user.roomId,
                roomType: roomTypeById(user.roomId)
            });

            callback(null, user);
        });
    }

    function callGameRoom(callerUsername, calleeUsername, gameId, callback) {
        var socket = sockets[calleeUsername];
        if (!socket) { callback(new Error('cannot found: ' + calleeUsername)); return; }

        socket.emit('called-game', {
            gameId: gameId,
            callerUsername: callerUsername
        });

        callback(null);
    }

    function startGame(socket, users, gameId, gameLimitSeconds, delaySeconds, callback) {
        async.waterfall([
            function (callback) {
                Game.initialize({_id: gameId}, users, {}, function (err, game) { callback(err, game); });
            },
            function (game, callback) {
                game.start(gameLimitSeconds, delaySeconds, function (err, game) { callback(err, game); });
            },
            function (game, callback) {
                game.populate('users.user', function (err, game) { callback(err, game); });
            },
            function (game, callback) {
                io.to(String(gameId)).emit('start-game', {game: game});
                callback(null, game);
            }
        ], callback);
    }

    /**** helper *****/

    function serverErrorWrap(err, otherParam, fn) {
        console.error(err);
        fn(_.extend({
            status: 'server error',
            message: err.message
        }, otherParam || {}));
    }

    function userErrorWrap(message, otherParam, fn) {
        fn(_.extend({
            status: 'error',
            message: message
        }, otherParam || {}));
    }

    function successWrap(message, otherParam, fn) {
        fn(_.extend({
            status: 'success',
            message: message
        }, otherParam || {}));
    }

    // passport チェック
    function checkAuth(socket, fn) {
        var user = users[socket.id];

        if (!user) {
            serverErrorWrap(new Error('undefined user'), {}, fn);
            return false;
        }

        if (!user.info) {
            userErrorWrap('must be login', {}, fn);
            return false;
        }

        return true;
    }

    function roomTypeById(id) {
        return (id === null || id === undefined) ? null :
            id === lobbyId ? 'lobby' : 'game';
    }
};