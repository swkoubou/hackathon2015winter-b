(function () {
    var socket = io.connect();

    socket.on('connect', function () {
        console.log('connect socket.io', arguments);
    });

    socket.on('disconnect', function () {
        console.log('disconnect socket.io', arguments);
    });

}());