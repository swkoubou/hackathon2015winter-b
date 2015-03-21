(function(){
  'use strict';
  var Model = ns('swkoubou.hackathon2015winter.Model');

// 基本ブロッククラス
  Model.Block = enchant.Class.create(enchant.Sprite, {
    initialize: function(type, leftRightColor, rightLeftColor){
      var game = enchant.Core.instance;
      Sprite.call(this, Model.Block.BLOCK_SIZE, Model.Block.BLOCK_SIZE);
      this.leftRightColor = leftRightColor;
      this.rightLeftColor = rightLeftColor;
      this.type = type;
      var group = new Group();

      var base = new Sprite(Model.Block.BLOCK_SIZE, Model.Block.BLOCK_SIZE);
      base.image = game.assets['../images/block.png'];
      group.addChild(base);

      var line1 = new Sprite(Model.Block.BLOCK_SIZE, Model.Block.BLOCK_SIZE);
      line1.image = game.assets[Model.Block.ASSETS[this.leftRightColor - 1]];
      group.addChild(line1);

      var line2 = new Sprite(Model.Block.BLOCK_SIZE, Model.Block.BLOCK_SIZE);
      line2.image = game.assets[Model.Block.ASSETS[this.rightLeftColor - 1 + Model.Block.COLOR_COUNT]];;
      group.addChild(line2);

      this.group = group;
    },

    getGroup: function(){
      return this.group;
    },

    getRightLeftColor: function(){
      return this.rightLeftColor;
    },

    getLeftRightColor: function(){
      return this.leftRightColor;
    }
  });

  Model.Block.COLOR_COUNT = 0;
  Model.Block.BLOCK_SIZE = 64;

  // 配列に左に三色、右に三色、最後にブロックのベース画像が入っている
  Model.Block.ASSETS = (function(){
    var ARROWS = ['Left', 'Right'];
    var COLORS = ['Red', 'Blue', 'Green'];
    Model.Block.COLOR_COUNT = COLORS.length;
    var BLOCK = 'block';
    var res;
    var PATH = '../images/';
    var SUFFIX = 'Line';
    var EXT = '.png';
    var res = _.chain(ARROWS).map(function(arrow){
      return _.map(COLORS, function(color){
        return PATH + arrow + color + SUFFIX + EXT;
      });
    }).flatten().value();
    res.push(PATH + BLOCK + EXT);
    Model.Block.ASSETS = res;
    return res;
  }).call(this);
  
}).call(this);