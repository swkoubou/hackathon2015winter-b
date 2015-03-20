(function(){
  'use strict';
  var Model = ns('swkoubou.hackathon2015winter.Model');

// 基本ブロッククラス
  Model.Block = Class.create(Sprite, {
    BLOCK_SIZE: 64,
    initialize: function(type, leftRightColor, rightLeftColor){
      Sprite.call(this.BLOCK_SIZE, this.BLOCK_SIZE);
      this.leftRightColor = leftRightColor;
      this.rightLeftColor = rightLeftColor;
      this.type = type;
    },
    getRightLeftColor: function(){
      return this.rightLeftColor;
    },
    getLeftRightColor: function(){
      return this.leftRightColor;
    }
  });
  
}).call(this);