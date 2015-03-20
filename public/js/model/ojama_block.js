(function(){
  'use strict';
  var Model = ns('swkoubou.hackathon2015winter.Model');

  var OjamaBlock = enchant.Class.create(Model.Block, {
    initialize: function(){
      Block.call(this, 0, 0, 0);
    }
  });
}).call(this);