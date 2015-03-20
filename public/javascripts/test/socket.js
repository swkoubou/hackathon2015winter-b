(function () {
    'use strict';

    var socket = io.connect();

    socket.on('connect', function () {
        console.log('connect socket.io', arguments);
        joinRobby();
    });

    socket.on('disconnect', function () {
        console.log('disconnect socket.io', arguments);
    });

    socket.on('join-room', function (res) {
        console.log('join-room', res);
    });

    socket.on('leave-room', function (res) {
        console.log('leave-room', res);
    });

    function joinRobby() {
        socket.emit('join-robby');
    }

    function leaveRobby() {
        socket.emit('leave-robby');
    }

}());