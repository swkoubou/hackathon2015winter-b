(function(){
  'use strict';
  var Model = ns('swkoubou.hackathon2015winter.Model');

  Model.OjamaBlock = enchant.Class.create(Model.Block, {
    initialize: function(){
      Block.call(this, 0, 0, 0);
    }
  });

  Model.OjamaBlock.ASSETS = (function(){
    var res = [];
    res.push('../images/ojamablock.png');
    return res;
  }).call();

}).call(this);