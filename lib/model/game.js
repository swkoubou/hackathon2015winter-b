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

/**
 * ゲームを始める
 * @params gameTotalSeconds ゲームの制限時間(秒)
 * @params delaySeconds 現在時刻からゲームの開始までのディレイ(秒)
 */
Games.method('start', function (gameTotalSeconds, delaySeconds) {
    var game = this;

    var now = new Date();
    if (delaySeconds) {
        now.setSeconds(now.getSeconds() + delaySeconds);
    }

    var end = new Date(now);
    end.setSeconds(end.getSeconds() + gameTotalSeconds);

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