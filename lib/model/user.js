var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userStatus = require('./userStatus');
var Game = require('./game');
var ObjectId = Schema.ObjectId;

var Users = new Schema({
    name: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    profileImageURL: { type: String },
    status: { type: String, default: userStatus.logout, enum: Object.keys(userStatus), required: true },
    gameId: { type: ObjectId, ref: 'Game', default: null },
    roomId: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, required: true }
});

// Userを取得する
// 存在しない検索条件なら、作成して返す
Users.static('findOrCreate', function (name, params, callback) {
    var that = this;

    that.findOne({name: name}).exec(function (err, user) {
        if (err) { callback(err); return; }

        if (user !== null) {    // ユーザが存在した
            user.update(params, callback);
            return;
        }

        that.create(params, callback);
    });
});

Users.static('updateStatus', function (name, status, callback) {
    this.findOne({name: name}, function (err, user) {
        if (err) { callback(err); return; }
        if (!user) { callback(new Error('undefined user: ' + name)); return; }

        user.status = status;
        user.save(callback);
    })
});

if (!mongoose.models.User) { module.exports = mongoose.model('User', Users); }
else { module.exports = mongoose.model('User'); }