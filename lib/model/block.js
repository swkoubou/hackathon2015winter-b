var _ = require('underscore');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var blockTypes = require('./blockTypes');

var Blocks = new Schema({
    type: { type: String, default: blockTypes.normal, enum: Object.keys(blockTypes), required: true },
    lineType1: { type: Number, default: 0, required: true },
    lineType2: { type: Number, default: 0, required: true }
});

Blocks.static('createOjamaParams', function () {
    return {
        type: blockTypes.ojama,
        lineType1: 0,
        lineType2: 0
    };
});

Blocks.static('createRandomNormalParams', function (lineTypeNum) {
    return {
        type: blockTypes.normal,
        lineType1: _.random(1, lineTypeNum),
        lineType2: _.random(1, lineTypeNum)
    };
});

if (!mongoose.models.Block) { module.exports = mongoose.model('Block', Blocks); }
else { module.exports = mongoose.model('Block'); }