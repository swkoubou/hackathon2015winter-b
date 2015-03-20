(function () {
    'use strict';

    var socket = io.connect(),
        onKeys = ['connect', 'disconnect', 'join-room', 'leave-room', 'called-game', 'start-game'];

    // debug
    onKeys.forEach(function (key) {
        socket.on(key, function(res) {
            console.log('on: ' + key, res);
        });
    });

    // debug
    (function (f) {
        socket.emit = function (key, req, fn) {
            var callback = function (res) {
                console.log('callback: ' + key, res);
                if (fn) {
                    fn.apply(this, arguments);
                }
            };

            console.log('emit: ' + key, req);

            f.call(socket, key, req, callback);
        };
    }(socket.emit));

    //////////

    socket.on('connect', function () {
        joinRobby();
    });

    socket.on('called-game', function (req) {
        joinGame(req.gameId);
    });

    function joinRobby(callback) {
        socket.emit('join-robby', {}, callback);
    }

    function leaveRobby(callback) {
        socket.emit('leave-robby', {}, callback);
    }

    function callGame(targetUsername, callback) {
        socket.emit('call-game', { targetUsername: targetUsername }, callback);
    }

    function joinGame(gameId, callback) {
        socket.emit('join-game', { gameId: gameId }, callback);
    }

    function startGame(callback) {
        socket.emit('start-game', {}, callback);
    }

    //////////

    $('#call-game-btn').click(function () {
        var targetUsername = $('#call-username').val();
        callGame(targetUsername);
    });

    $('#start-game-btn').click(function () {
        startGame();
    });

}());