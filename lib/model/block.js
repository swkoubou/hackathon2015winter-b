var _ = require('underscore');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var blockTypes = require('./blockTypes');

var Blocks = new Schema({
    type: { type: String, default: blockTypes.normal, enum: Object.keys(blockTypes), required: true },
    lineTypes: [{ type: Number, default: 0, required: true }],
    createdAt: { type: Date, default: Date.now, required: true }
});

Blocks.static('createOjamaParams', function () {
    return {
        type: blockTypes.ojama,
        lineTypes: [0, 0]
    };
});

Blocks.static('createRandomNormalParams', function (lineTypeNum) {
    return {
        type: blockTypes.normal,
        lineTypes: [_.random(1, lineTypeNum), _.random(1, lineTypeNum)]
    };
});

Blocks.static('swap', function (block1, block2) {
    var len = block1.lineTypes.length;
    var i, temp;

    temp = block1.type;
    block1.type = block2.type;
    block2.type = temp;

    for (i = 0; i < len; i++) {
        temp = block1.lineTypes[i];
        block1.lineTypes[i] = block2.lineTypes[i];
        block2.lineTypes[i] = temp;
    }
});

if (!mongoose.models.Block) { module.exports = mongoose.model('Block', Blocks); }
else { module.exports = mongoose.model('Block'); }