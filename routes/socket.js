var socketio = require('socket.io');
var _ = require('underscore');
var async = require('async');
var sessionMiddleware = require('../lib/module/sessionMiddleware');
var User = require('../lib/model/user');
var Game = require('../lib/model/game');
var userStatus = require('../lib/model/userStatus');

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
        user.username = user.info.username;
        sockets[user.username] = socket;

        // 接続したらユーザのステータスをログインにする
        socket.leave(robbyId);
        User.updateStatus(user.username, userStatus.login, function (err) {
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

                async.series([
                    leaveRoom.bind(this, socket, user),
                    joinGameRoom.bind(this, socket, user, game._id),
                    callGameRoom.bind(this, user.username, req.targetUsername, game._id)
                ], function (err) {
                    if (err) { serverErrorWrap(err, {}, fn); return; }
                    successWrap('joined game room', {
                        game: game,
                        roomId: game._id,
                        robbyType: 'gameRoom'
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

                async.series([
                    leaveRoom.bind(this, socket, user),
                    joinGameRoom.bind(this, socket, user, game._id)
                ], function (err) {
                    if (err) { serverErrorWrap(err, {}, fn); return; }
                    successWrap('joined game room', {
                        game: game,
                        roomId: req.gameId,
                        roomType: 'gameRoom'
                    }, fn);
                });
            });
        });

        // 切断
        socket.on('disconnect', function () {
            console.log('disconnected: ' + socket.id);

            async.series([
                leaveRoom.bind(this, socket, user),
                User.updateStatus.bind(User, user.username, userStatus.logout)
            ], function (err) {
                if (err) { console.error(err); }

                socket.leaveAll();
                delete users[socket.id];
                delete sockets[user.username];
            });
        });
    });

    /**** emitter and method *****/

    function joinRobbyRoom(socket, user, callback) {
        User.updateStatus(user.username, userStatus.robby, function (err) {
            if (err) { callback(err); return; }

            socket.join(robbyId);
            user.roomId = robbyId;
            socket.to(robbyId).json.emit('join-room', {
                username: user.username,
                roomId: robbyId,
                roomType: 'robby'
            });

            callback(null);
        });
    }

    function leaveRoom(socket, user, callback) {
        if (!user) { callback(null); return; }

        User.updateStatus(user.username, userStatus.login, function (err) {
            if (err) { callback(err); return; }

            var roomId = user.roomId;
            if (roomId) {
                socket.leave(roomId);
                socket.to(roomId).json.emit('leave-room', {
                    username: user.username,
                    roomId: roomId,
                    roomType: roomId === robbyId ? 'robby' : 'gameRoom'
                });
            }

            callback(null);
        });
    }

    function joinGameRoom(socket, user, gameId, callback) {
        User.findOneAndUpdate({name: user.username}, {
            status: userStatus.playing,
            game: gameId
        }, function (err) {
            if (err) { callback(err); return; }

            socket.join(gameId);
            user.roomId = gameId;
            socket.to(gameId).json.emit('join-room', {
                username: user.username,
                roomId: robbyId,
                roomType: 'gameRoom'
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