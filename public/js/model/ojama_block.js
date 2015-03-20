(function(){
  'use strict';
  var Model = ns('swkoubou.hackathon2015winter.Model');

  var OjamaBlock = Class.create(Model.Block, {
    initialize: function(){
      Block.call(this, 0, 0, 0);
    }
  });
}).call(this);