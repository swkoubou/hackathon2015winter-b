(function () {
    'use strict';

    var socket = io.connect(),
        onKeys = ['connect', 'disconnect', 'join-room', 'leave-room', 'called-game', 'start-game', 'swap-blocks'];

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

    socket.on('swap-blocks', function (req) {
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

    function swapBlocks(block1, block2, callback) {
        socket.emit('swap-blocks', { block1: block1, block2: block2 }, callback);
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

    $('#random-swap-blocks-btn').click(function () {
        swapBlocks({
            x: _.random(0, 9),
            y: _.random(0, 9)
        }, {
            x: _.random(0, 9),
            y: _.random(0, 9)
        }, function (req) {
            //updateBlocks(req.game);
        });
    });

    $('#swap-blocks-btn').click(function () {
        swapBlocks({
            x: Number($('#swap-blocks-x1').val()),
            y: Number($('#swap-blocks-y1').val())
        }, {
            x: Number($('#swap-blocks-x2').val()),
            y: Number($('#swap-blocks-y2').val())
        }, function (req) {
            //updateBlocks(req.game);
        });
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

                var str = block.type === 'ojama' ? '□' : 'X';
                var $span = $('<span>' + str + '</span>');

                ['color', 'backgroundColor'].forEach(function (key, j) {
                    var color = '000000ff';
                    _.times(3 - Number(block.lineTypes[j]), function () {
                        color += '00';
                    });
                    color = '#' + color.slice(-6);
                    $span.css(key, color);
                });


                $li.append($span);

                if (!((i + 1) % 10)) {
                    $ul.append($li);
                }
            });
        });
    }

}());