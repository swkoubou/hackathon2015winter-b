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
        joinLobby();
    });

    socket.on('called-game', function (req) {
        joinGame(req.gameId);
    });

    socket.on('start-game', function (req) {
        updateBlocks(req.game);
    });

    function joinLobby(callback) {
        socket.emit('join-lobby', {}, callback);
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

    $('#join-lobby-btn').click(function () {
        joinLobby();
    });

    function updateBlocks(game) {
        var $uls = $('#blocks ul');

        $uls.each(function (i) {
            var $ul = $(this);
            $ul.children('li').remove();

            var $li;
            game.users[i].blocks.forEach(function (block, i) {
                if (!(i % 10)) {
                    $li = $('<li></li>');
                }

                var str = block.type === 'ojama' ? 'x' : 'o';
                $li.append('<span>' + str + '</span>');

                if (!((i + 1) % 10)) {
                    $ul.append($li);
                }
            });
        });
    }

}());