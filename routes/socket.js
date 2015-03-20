var socketio = require('socket.io');
var _ = require('underscore');
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

        checkAuth(socket, function (message) { socket.disconnect(message); });

        socket.leave(robbyId);
        User.updateStatus(user.username, userStatus.login, function (err) {
            if (err) {
                console.error(err);
                socket.disconnect(err);
            }
        });

        /***** イベント登録 *****/

        // 切断
        socket.on('disconnect', function () {
            console.log('disconnected: ' + socket.id);
            leaveRoom(socket);
            socket.leaveAll();
            delete users[socket.id];
        });
    });

    /**** emitter *****/

    /**** helper *****/

    function joinRoom(socket, roomId) {
        socket.join(roomId);
        users[socket.id].roomId = roomId;
    }

    function leaveRoom(socket) {
        var user = users[socket.id];
        if (!user) { return; }
        var roomId = user.roomId;

        if (roomId) {
            socket.leave(roomId);
        }
    }

    function serverErrorWrap(fn, err, otherParam) {
        console.error(err);
        fn(_.extend({
            status: 'server error',
            message: err.message
        }, otherParam || {}));
    }

    function userErrorWrap(fn, message, otherParam) {
        fn(_.extend({
            status: 'error',
            message: message
        }, otherParam || {}));
    }

    function successWrap(fn, message, otherParam) {
        fn(_.extend({
            status: 'success',
            message: message
        }, otherParam || {}));
    }

    // passport チェック
    function checkAuth(socket, fn) {
        var user = users[socket.id];

        if (!user) {
            serverErrorWrap(new Error('undefined user'), fn);
            return false;
        }

        if (!user.info) {
            userErrorWrap('must be login', fn);
            return false;
        }

        return true;
    }

    function checkJoinedGameRoom(socket, fn) {
        var user = users[socket.id];

        if (!checkAuth(socket, fn)) { return false; }

        if (!user.projectRoomId) {
            userErrorWrap('must be join game room', fn);
            return false;
        }

        return true;
    }
};