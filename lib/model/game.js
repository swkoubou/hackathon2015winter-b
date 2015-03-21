var _ = require('underscore');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;
var gameStatus = require('./gameStatus');
var Block = require('./block');
var blockTypes = require('./blockTypes');

var Games = new Schema({
    users: [{
        user: { type: ObjectId, ref: 'User', required: true },
        score: { type: Number, default: 0, required: true },
        blocks: [Block.schema]  // stageWidth * stageHeight, blocks_x_y => blocks[x + y * stageWidth]
    }],
    winner: { type: ObjectId, ref: 'User' },
    stageWidth: { type: Number, default: 10, required: true },
    stageHeight: { type: Number, default: 10, required: true },
    ojamaMaxNum: { type: Number, default: 10, required: true }, // おじゃまブロックの最大数(全プレイヤー合わせて)
    blockLineTypeNum: { type: Number, default: 3, required: true }, // ブロックラインカラーのタイプ数(色なし含めず)
    startTime: { type: Date },
    endTime: { type: Date },
    status: { type: String, default: gameStatus.pending, enum: Object.keys(gameStatus), required: true },
    createdAt: { type: Date, default: Date.now, required: true }
});

/**
 * ゲームの初期化
 * @params users user一覧
 * @params o Options: stageWidth, stageHeight, ojamaMaxNum, blockLineTypeNum
 * @params callback callback
 */
Games.method('initialize', function (users, o, callback) {
    var game = this;

    o = o || {};

    var stageWidth = game.stageWidth = o.stageWidth || game.stageWidth;
    var stageHeight = game.stageHeight = o.stageHeight || game.stageHeight;
    var ojamaMaxNum = game.ojamaMaxNum = o.ojamaMaxNum || game.ojamaMaxNum;
    var blockLineTypeNum = game.blockLineTypeNum = o.blockLineTypeNum || game.blockLineTypeNum;

    users.forEach(function (user) {
        game.users.push({
            user: user,
            score: 0,
            blocks: initBlocks(stageWidth, stageHeight, Math.floor(ojamaMaxNum / users.length), blockLineTypeNum)
        });
    });

    game.save(callback);
});

Games.static('initialize', function (where, users, o, callback) {
    this.findOne(where, function (err, game) {
        if (err) { callback(err); return; }
        if (!game) { callback(new Error('not found game')); return; }
        game.initialize(users, o, callback);
    });
});

/**
 * ゲームを始める
 * @params gameLimitSeconds ゲームの制限時間(秒)
 * @params delaySeconds 現在時刻からゲームの開始までのディレイ(秒)
 */
Games.method('start', function (gameLimitSeconds, delaySeconds, callback) {
    var game = this;

    var now = new Date();
    if (delaySeconds) {
        now.setSeconds(now.getSeconds() + delaySeconds);
    }

    var end = new Date(now);
    end.setSeconds(end.getSeconds() + gameLimitSeconds);

    game.startTime = now;
    game.endTime = end;
    game.status = gameStatus.playing;

    game.save(callback);
});

/**
 * 指定したユーザのブロック群を、おじゃまブロックの数を維持したままリセットする
 * @params userName ユーザ名
 * @params callback callback
 */
Games.method('resetBlocks', function (userName, callback) {
    var game = this;

    var user = _.find(game.users, function (user) {
        return user.user && user.user.name === userName;
    });

    if (!user) {
        callback(new Error('cannot found username: ' + userName));
        return;
    }

    var ojamaNum = _.countBy(user.blocks, function (block) {
        return block.type === blockTypes.ojama;
    });

    user.blocks = initBlocks(game.stageWidth, game.stageHeight, ojamaNum, game.blockLineTypeNum);

    game.save(callback);
});

// ブロックを入れ替える
Games.method('swapBlocks', function (userId, blockQuery1, blockQuery2, callback) {
    var game = this;

    var user = findUserByIdWrap(game, userId);
    if (!user) { return; }

    var idx1 = toIndex(game, blockQuery1.x, blockQuery1.y);
    var idx2 = toIndex(game, blockQuery2.x, blockQuery2.y);

    var b1 = user.blocks[idx1];
    var b2 = user.blocks[idx2];

    user.blocks.splice(idx1, 1, b2);
    user.blocks.splice(idx2, 1, b1);

    game.save(callback);
});

// ブロックを線で囲んで消す
Games.method('blockWrapErase', function (userId, blockQueries, callback) {
    var game = this;

    var user = findUserByIdWrap(game, userId, callback);
    if (!user) { return; }
    var blocks = user.blocks;

    game.checkWrap(userId, blockQueries, function (err, canWrap) {
        if (err) { callback(err); return; }
        if (!canWrap) { callback(new Error('cannot block wrap erase')); return; }

        var y, x;

        // 2次元座標にする
        var block2d = [];
        for (y = 0; y < game.stageHeight; y++) {
            for (x = 0; x < game.stageWidth; x++) {
                if (!x) {
                    block2d[y] = [];
                }
                block2d[y].push(blocks[toIndex(game, x, y)]);
            }
        }

        // 囲んでる座標をフォーマット
        var wrapped2d = [];
        for (y = 0; y < game.stageHeight; y++) {
            for (x = 0; x < game.stageWidth; x++) {
                if (!x) {
                    wrapped2d[y] = [];
                }
                wrapped2d[y].push(false);
            }
        }
        blockQueries.forEach(function (blockQuery) {
            wrapped2d[blockQuery.y][blockQuery.x] = true;
        });

        // 囲んでるのと囲まれてるのを消す
        var newBlock2d = [], inWrap, erasedBlocks = [], erasedOjamaNum = 0;
        for (y = 0; y < game.stageHeight; y++) {
            inWrap = false;
            for (x = 0; x < game.stageWidth; x++) {
                if (!x) {
                    newBlock2d[y] = [];
                }
                if (wrapped2d[y][x]) {
                    inWrap = !inWrap;
                }
                if (wrapped2d[y][x] || inWrap) {
                    erasedBlocks.push({ x: x, y: y, block: block2d[y][x] });
                    if (block2d[y][x].type === blockTypes.ojama) {
                        erasedOjamaNum++;
                    }
                } else {
                    newBlock2d[y].push(block2d[y][x]);
                }
            }
        }

        // 足りないブロックを作成する
        var createBlocks = [], newBlock;
        for (y = 0; y < game.stageHeight; y++) {
            for (x = newBlock2d[y].length; x < game.stageWidth; x++) {
                newBlock = Block.createRandomNormalParams(game.lineTypeNum);
                newBlock2d[y].push(newBlock);
                createBlocks.push({ x: x, y: y, block: newBlock });
            }
        }

        // ok
        var params = [0, game.stageHeight * game.stageWidth];
        Array.prototype.push.apply(params, newBlock2d);
        Array.prototype.splice.apply(game.blocks, params);
        game.save(function (err, game) {
            callback(err, game, createBlocks, erasedBlocks, erasedOjamaNum)
        });
    });
});

// ブロックで囲めるかチェックする
// direction  0: ／, 1: ＼
Games.method('checkWrap', function (userId, blockQueries, callback) {
    var game = this;

    var user = findUserByIdWrap(game, userId, callback);
    if (!user) { return; }
    var blocks = user.blocks;

    var isValid = _.range(0, 1).some(function (cubeDirection) {
        var vertical = cubeDirection ? 1 : -1;

        return blockQueries.every(function (query, queryIndex, queries) {
            var query1 = query;
            var query2 = queries[(queryIndex + 1) % queries.length];
            var idx1 = toIndex(game, query1.x, query1.y);
            var idx2 = toIndex(game, query2.x, query2.y);
            if (idx1 >= blocks.length || idx2.blocks.length) { return false; }

            var lineTypeNum1 = query1.lineTypeNum;
            var lineTypeNum2 = query2.lineTypeNum;
            var horizontal = (lineTypeNum1 ^ cubeDirection) ? -1 : 1;

            var lineType1 = blocks[idx1].lineTypes[lineTypeNum1];
            var lineType2 = blocks[idx2].lineTypes[lineTypeNum2];
            if (!lineType1 || !lineType2 || lineType1 !== lineType2) { return false; }

            var dx = query2.x - query1.x;
            var dy = query2.y - query1.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) { return false; }
            if (!dx && !dy) { return false; }

            var valids = [
                {   // straight
                    x: query1.x + horizontal,
                    y: query1.y + vertical,
                    lineTypeNum: query1.direction
                },
                {   // reverse horizontal
                    x: query1.x + (horizontal === 1 ? -1 : 1),
                    y: query1.y + vertical,
                    lineTypeNum: query1.lineTypeNum ? 0 : 1
                },
                {   // reverse vertical
                    x: query1.x,
                    y: query1.y + (vertical === 1 ? -1 : 1),
                    lineTypeNum: query1.lineTypeNum ? 0 : 1
                }
            ];

            var isValid = valids.some(function (valid) {
                return valid.x === query2.x &&
                       valid.y === query2.y &&
                       valid.lineTypeNUm === query2.lineTypeNum;
            });

            if (!isValid) { return false; }

            if (query1.y === query2.y) {
                vertical = vertical === 1 ? -1 : 1;
            }
        });
    });

    callback(null, isValid);
});

function toIndex(game, x, y) {
    return y * game.stageWidth + x;
}

// game.users[i]を取得する (game.users[i].userではないことに注意）
function findUserByIdWrap(game, userId, callback) {
    var user = _.find(game.users, function (user) { return String(user.user) === userId; });

    if (!user) {
        callback(new Error('not found user id: ' + userId));
        return false;
    }

    return user;
}

// ブロック群の初期化
function initBlocks (stageWidth, stageHeight, ojamaNum, blockLineTypeNum) {
    var blocks = [];

    _.times(ojamaNum, function () {
        blocks.push(Block.createOjamaParams());
    });

    _.times(stageWidth * stageHeight - ojamaNum, function () {
        blocks.push(Block.createRandomNormalParams(blockLineTypeNum));
    });

    return _.shuffle(blocks);
}

if (!mongoose.models.Game) { module.exports = mongoose.model('Game', Games); }
else { module.exports = mongoose.model('Game'); }