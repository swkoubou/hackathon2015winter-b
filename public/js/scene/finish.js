(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');
  var Scenes = ns('swkoubou.hackathon2015winter.Scenes');
  var Model = ns('swkoubou.hackathon2015winter.Model');

  var OVERLAY_COLOR = 'rgba(0, 0, 0, .8)';
  
  // ゲーム終了時の画面
  Scenes.showFinishScene = function(){
    var game = enchant.Core.instance;
    var scene = new Scene();
    scene.backgroundColor = OVERLAY_COLOR;
    var finishText = new Model.NotoLabel('600%');
    finishText.text = 'Finish!';
    finishText.color = '#FF5722';
    finishText.width = WIDTH;
    finishText.textAlign = 'center';
    finishText.moveTo(0, (HEIGHT - finishText._boundHeight) / 2);
    scene.addChild(finishText);
    game.pushScene(scene);
  };
}).call(this);