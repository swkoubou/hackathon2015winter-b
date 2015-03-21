(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');
  var App = ns('swkoubou.hackathon2015winter.App');
  var Model = ns('swkoubou.hackathon2015winter.Model');
  var Scenes = ns('swkoubou.hackathon2015winter.Scenes');

  enchant();
  Package.global = {
    WIDTH: 1400,
    HEIGHT: 900,
    TILE_COUNT: 100,
    TILE_WIDTH: 64,
    TILE_HEIGHT: 64,
    SCREEN_WIDTH: 1320,
    SCREEN_HEIGHT: 640,
    TOP_MARGIN: 120,
    LEFT_MARGIN: 40,
    RIGHT_MARGIN: 40,
    SCREEN_BORDER_WIDTH: 3,
    GAP: 40
  };
  var WIDTH = Package.global.WIDTH;
  var HEIGHT = Package.global.HEIGHT;
  var LEFT_MARGIN = Package.global.LEFT_MARGIN;
  var FINISH_TEXT_SHOW_TIME = 3;

  App.start = function(gameInfo, p1, p2){
    var game = new Core(WIDTH, HEIGHT);
    game.preload(Model.Block.ASSETS, Model.OjamaBlock.ASSETS); // load game resource
    game.fps = 30;
    game.onload = function(){
      // dummy block data
      _.each([p1, p2], function(player){
        for(var i = 0; Package.global.TILE_COUNT > i; i++){
          var tile = new Model.Block(0, _.random(1, 3), _.random(1, 3));
          player.tiles.push(tile);
        }
      });
      Scenes.changeGame(gameInfo, p1, p2, function(timer){
        game.removeEventListener(enchant.Event.ENTER_FRAME, timer.update);
        showFinishScene();
        // FINISH_TEXT_SHOW_TIMEミリ後に結果表示
        _.delay(changeResultScene, FINISH_TEXT_SHOW_TIME);
      });
    };
    // game.scale = 1.5;
    game.start();
  };

  // ゲーム始まる直前のReady go 画面を表示させる予定
  function changeReadyScene(){

  }

  // タイムアップ時のコールバック関数
  function timeUpCallback(){

  }

  //結果表示画面
  function changeResultScene(){

  }

}).call(this);