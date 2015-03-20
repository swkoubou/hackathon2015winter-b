(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');
  var App =  ns('swkoubou.hackathon2015winter.App');
  var Model = Package.Model;

  enchant();
  Package.global = {
    WIDTH: 1400,
    HEIGHT: 900,
    TILE_COUNT: 100,
    TILE_WIDTH: 64,
    TILE_HEIGHT: 64,
    TOP_MARGIN: 120
  };
  var WIDTH = Package.global.WIDTH;
  var HEIGHT = Package.global.HEIGHT;
  var OVERLAY_COLOR = 'rgba(0, 0, 0, .8)';
  var LEFT_MARGIN = 40;
  var RIGHT_MARGIN = 40;
  var FINISH_TEXT_SHOW_TIME = 3;
  var SQUARE_STROKE_WIDTH = 3;

  App.start = function(gameInfo, p1, p2){
    var game = new Core(WIDTH, HEIGHT);
    game.preload(); // load game resource
    game.fps = 60;
    game.onload = function(){
      changeGameScene(gameInfo, p1, p2);
    };
    // game.scale = 1.5;
    game.start();
  };

  // ゲーム始まる直前のReady go 画面を表示させる予定
  function changeReadyScene(){

  }

  // ゲーム中画面
  function changeGameScene(gameInfo, p1, p2){
    var timer = new Model.Timer();
    var game = enchant.Core.instance;
    game.addEventListener(enchant.Event.ENTER_FRAME, timer.update);
    timer.setTimeUpCallback(function(){
      game.removeEventListener(enchant.Event.ENTER_FRAME, timer.update);
      showFinishScene();
      // FINISH_TEXT_SHOW_TIMEミリ後に結果表示
      _.delay(changeResultScene, FINISH_TEXT_SHOW_TIME);
    });
    var scene = new Scene();
    scene.backgroundColor = '#FFEBEE';
    timer.start(scene);
    var player1 = new Model.Player(p1.name, 0, scene, p1.tiles);
    var player2 = new Model.Player(p2.name, 1, scene, p2.tiles);
    game.replaceScene(scene);
    var squareWidth = WIDTH - LEFT_MARGIN;
    var squareHeight = HEIGHT - Package.global.TOP_MARGIN;
    var squareImage = new Sprite(squareWidth, squareHeight);
    var square = new Surface(squareWidth, squareHeight);
    square.context.strokeWidth = 3;
    square.context.beginPath();
    square.context.strokeStyle = '#004D40';
    square.context.strokeRect(LEFT_MARGIN, Package.global.TOP_MARGIN, squareWidth - LEFT_MARGIN - SQUARE_STROKE_WIDTH, squareHeight - Package.global.TOP_MARGIN - SQUARE_STROKE_WIDTH);
    squareImage.image = square;
    scene.addChild(squareImage);
  }

  // タイムアップ時のコールバック関数
  function timeUpCallback(){

  }

  // ゲーム終了時の画面
  function showFinishScene(){
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
  }

  //結果表示画面
  function changeResultScene(){

  }

}).call(this);