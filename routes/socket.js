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
    var robbyId = '0000';
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
        user.roomId = null;
        user.roomType = null;
        user.gameId = null;
        user.gameId = null;
        sockets[user.name] = socket;

        // 接続したらユーザのステータスを初期化する
        User.findOneAndUpdate({name: user.name}, {
            status: userStatus.login,
            game: null
        }, function (err) {
            if (err) {
                console.error(err);
                socket.disconnect(err);
            }
        });

        /***** イベント登録 *****/

        // ロビーに入る
        socket.on('join-robby', function (req, fn) {
            fn = fn || function () {};

            async.series([
                leaveRoom.bind(this, socket, user),
                joinRobbyRoom.bind(this, socket, user)
            ], function (err) {
                if (err) { serverErrorWrap(err, {}, fn); return; }
                successWrap('joined robby', {
                    roomId: robbyId,
                    roomType: 'robby'
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
            }

            Game.create({}, function (err, game) {
                if (err) { serverErrorWrap(err, {}, fn); return; }

                var roomId = String(game._id);

                async.series([
                    leaveRoom.bind(this, socket, user),
                    joinGameRoom.bind(this, socket, user, game._id),
                    callGameRoom.bind(this, user.name, req.targetUsername, game._id)
                ], function (err) {
                    if (err) { serverErrorWrap(err, {}, fn); return; }
                    successWrap('joined game room', {
                        game: game,
                        roomId: roomId,
                        robbyType: 'game'
                    }, fn);
                });
            });
        });

        // ゲームに参加する (呼出しに応じる)
        socket.on('join-game', function (req, fn) {
            req = req || {};
            fn = fn || function () {};

            if (!req.gameId) {
                userErrorWrap('invalid params: required gameId', req, fn);
            }

            Game.findOne({_id: req.gameId}, function (err, game) {
                if (err) { serverErrorWrap(err, {}, fn); return; }
                if (!game) { userErrorWrap('invalid params: not found gameId', req, fn); return; }

                var roomId = String(game._id);

                async.series([
                    leaveRoom.bind(this, socket, user),
                    joinGameRoom.bind(this, socket, user, game._id)
                ], function (err) {
                    if (err) { serverErrorWrap(err, {}, fn); return; }
                    successWrap('joined game room', {
                        game: game,
                        roomId: roomId,
                        roomType: 'game'
                    }, fn);
                });
            });
        });

        // ゲームを開始する
        socket.on('start-game', function (req, fn) {
            req = req || {};
            fn = fn || function () {};

            req.gameLimitSeconds = 5 * 1000;
            req.delaySeconds = 20;

            var roomId = user.roomId;
            var roomType = user.roomType;
            var gameId = user.gameId;
            if (!gameId || !roomId || roomType !== 'game') {
                userErrorWrap('must be in game room', {roomId: roomId, roomType: roomType, gameId: gameId}, fn);
                return;
            }

            User.find({status: userStatus.playing, game: gameId}, function (err, users) {
                if (err) { serverErrorWrap(err, {}, fn); return; }
                if (users.length < 2) {
                    userErrorWrap('user length must be equals 2 in same game room', {users: users}, fn);
                    return;
                }

                startGame(socket, users, gameId, req.gameLimitSeconds, req.delaySeconds, function (err, game) {
                    if (err) { serverErrorWrap(err); return; }
                    successWrap('game start!', {game: game}, fn);
                });
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

                socket.leaveAll();
                delete users[socket.id];
                delete sockets[user.name];
            });
        });
    });

    /**** emitter and method *****/

    function joinRobbyRoom(socket, user, callback) {
        User.updateStatus(user.name, userStatus.robby, function (err) {
            if (err) { callback(err); return; }

            user.roomId = robbyId;
            user.roomType = 'robby';
            socket.join(robbyId);
            io.to(robbyId).emit('join-room', {
                username: user.name,
                roomId: robbyId,
                roomType: 'robby'
            });

            callback(null);
        });
    }

    function leaveRoom(socket, user, callback) {
        if (!user) { callback(null); return; }

        User.findOneAndUpdate({name: user.name}, {
            status: userStatus.login,
            game: null
        }, function (err) {
            if (err) { callback(err); return; }

            var roomId = user.roomId;
            if (roomId) {
                user.gameId = null;
                user.roomId = null;
                user.roomType = null;
                socket.leave(roomId);
                io.to(roomId).emit('leave-room', {
                    username: user.name,
                    roomId: roomId,
                    roomType: roomId === robbyId ? 'robby' : 'game'
                });
            }

            callback(null);
        });
    }

    function joinGameRoom(socket, user, gameId, callback) {
        User.findOneAndUpdate({name: user.name}, {
            status: userStatus.playing,
            game: gameId
        }, function (err) {
            if (err) { callback(err); return; }

            user.gameId = gameId;
            var roomId = user.roomId = String(gameId);
            var roomType = user.roomType = 'game';
            socket.join(roomId);
            io.to(roomId).emit('join-room', {
                username: user.name,
                roomId: roomId ,
                roomType: roomType
            });

            callback(null);
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
        Game.initialize({_id: gameId}, users, {}, function (err, game) {
            if (err) { callback(err); return; }

            game.start(gameLimitSeconds, delaySeconds, function (err, game) {
                if (err) { callback(err); return; }

                var roomId = String(gameId);
                io.to(roomId).emit('start-game', {game: game});

                game.populate('users.user', callback);
            });
        });
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

    function checkJoinedGameRoom(socket, fn) {
        var user = users[socket.id];

        if (!checkAuth(socket, fn)) { return false; }

        if (!user.projectRoomId) {
            userErrorWrap('must be join game room', {}, fn);
            return false;
        }

        return true;
    }
};