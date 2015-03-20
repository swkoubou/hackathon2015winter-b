var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userStatus = require('./userStatus');
var Game = require('./game');
var ObjectId = Schema.ObjectId;

var Users = new Schema({
    name: { type: String, required: true, unique: true },
    status: { type: String, default: userStatus.login, enum: Object.keys(userStatus), required: true },
    game: { type: ObjectId, ref: 'Game', default: null },
    createdAt: { type: Date, default: Date.now, required: true }
});

// Userを取得する
// 存在しない検索条件なら、作成して返す
Users.static('findOrCreate', function (name, callback) {
    var that = this;

    console.log(name);

    that.findOne({name: name}).exec(function (err, user) {
        if (err) { callback(err); return; }

        if (user !== null) {    // ユーザが存在した
            callback(null, user);
            return;
        }

        that.create({name: name}, function (err, user) {
            if (err) { callback(err); }
            else { callback(null, user); }
        });
    });
});

if (!mongoose.models.User) { module.exports = mongoose.model('User', Users); }
else { module.exports = mongoose.model('User'); }