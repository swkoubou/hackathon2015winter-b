(function(){
  'use strict';
  var Model = ns('swkoubou.hackathon2015winter.Model');

  var FONT_PROP = '/1.5 "Noto sans"';

  // Notoフォントで表示するためだけのクラス
  Model.NotoLabel = enchant.Class.create(enchant.Label, {
    initialize: function(fontSize){
      Label.call(this);
      fontSize = fontSize || '100%';
      this.font = fontSize.toString() + FONT_PROP;
    }
  });
}).call(this);