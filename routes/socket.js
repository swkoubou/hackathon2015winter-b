var socketio = require('socket.io');
var _ = require('underscore');
var async = require('async');
var sessionMiddleware = require('../lib/module/sessionMiddleware');
var User = require('../lib/model/user');
var userStatus = require('../lib/model/userStatus');

module.exports = function (server) {
    var io = socketio.listen(server);
    var users = {};
    var robbyId = '0000';

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

        // 接続したらユーザのステータスをログインにする
        socket.leave(robbyId);
        User.updateStatus(user.info.username, userStatus.login, function (err) {
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
                joinRoom.bind(this, socket, user, robbyId)
            ], function (err) {
                if (err) { serverErrorWrap(err, {}, fn); }
                else { successWrap('joined robby', {}, fn) }
            });
        });

        // 切断
        socket.on('disconnect', function () {
            console.log('disconnected: ' + socket.id);

            async.series([
                leaveRoom.bind(this, socket, user),
                User.updateStatus.bind(User, user.info.username, userStatus.logout)
            ], function (err) {
                if (err) { console.error(err); }

                socket.leaveAll();
                delete users[socket.id];
            });
        });
    });

    /**** emitter *****/

    /**** helper *****/

    function joinRoom(socket, user, roomId, callback) {
        var nextStatus = roomId === robbyId ? userStatus.robby : userStatus.playing;

        User.updateStatus(user.info.username, nextStatus, function (err) {
            if (err) { callback(err); return; }

            socket.join(roomId);
            user.roomId = roomId;
            socket.to(roomId).json.emit('join-room', {
                username: user.info.username
            });

            callback(null);
        });
    }

    function leaveRoom(socket, user, callback) {
        if (!user) { callback(null); }

        User.updateStatus(user.info.username, userStatus.login, function (err) {
            if (err) { callback(err); return; }

            var roomId = user.roomId;
            if (roomId) {
                socket.leave(roomId);
                socket.to(roomId).json.emit('leave-room', {
                    username: user.info.username
                });
            }

            callback(null);
        });
    }

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