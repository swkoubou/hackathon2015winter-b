$(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');

  enchant();
  var WIDTH = 1400;
  var HEIGHT = 800;
  var OVERLAY_COLOR = 'rgba(0, 0, 0, .8)';
  var LEFT_MARGIN = 40;
  var RIGHT_MARGIN = 40;
  var TOP_MARGIN = 120;
  var CELL_HEIGHT = 64;
  var CELL_WIDTH = 64;
  var FINISH_TEXT_SHOW_TIME = 3;
  var SQUARE_STROKE_WIDTH = 3;

  // global variables
  var game = new Core(WIDTH, HEIGHT);
  var timer = new Timer();

  init();

  function init(){
    game.preload(); // load game resource
    game.fps = 60;
    game.players = {};
   game.onload = function(){
      changeGameScene();
    };
    // game.scale = 1.5;
    game.start();
  }

  // ゲーム始まる直前のReady go 画面を表示させる予定
  function changeReadyScene(){

  }

  // ゲーム中画面
  function changeGameScene(){
    timer.setTimeUpCallback(timeUpCallback);
    game.addEventListener(enchant.Event.ENTER_FRAME, countDownCallback);
    var scene = new Scene();
    scene.backgroundColor = '#FFEBEE';
    game.replaceScene(scene);
    timer.start(scene);
    var player1 = new Player('_X_y_z_', 0, scene);
    var player2 = new Player('sunya', 1, scene);
    var squareWidth = WIDTH - LEFT_MARGIN;
    var squareHeight = HEIGHT - TOP_MARGIN;
    var squareImage = new Sprite(squareWidth, squareHeight);
    var square = new Surface(squareWidth, squareHeight);
    square.context.strokeWidth = 3;
    square.context.beginPath();
    square.context.strokeStyle = '#004D40';
    square.context.strokeRect(LEFT_MARGIN, TOP_MARGIN, squareWidth - LEFT_MARGIN - SQUARE_STROKE_WIDTH, squareHeight - TOP_MARGIN - SQUARE_STROKE_WIDTH);
    squareImage.image = square;
    scene.addChild(squareImage);
  }

  // ゲーム中のタイマーコールバック 残り時間表示アップデートと終了処理
  function countDownCallback(){
    var remain = timer.update();
  }

  // タイムアップ時のコールバック関数
  function timeUpCallback(){
    game.removeEventListener(enchant.Event.ENTER_FRAME, countDownCallback);
    showFinishScene();

    // FINISH_TEXT_SHOW_TIMEミリ後に結果表示
    setTimeout(function(){
      changeResultScene();
    }, FINISH_TEXT_SHOW_TIME);
  }

  // ゲーム終了時の画面
  function showFinishScene(){
    var scene = new Scene();
    scene.backgroundColor = OVERLAY_COLOR;
    var finishText = new NotoLabel('600%');
    finishText.text = 'Finish!';
    finishText.color = '#FF5722';
    finishText.width = WIDTH;
    finishText.textAlign = 'center';
    finishText.moveTo(0, (HEIGHT - finishText._boundHeight) / 2);
    scene.addChild(finishText);
    enchant.Core.instance.pushScene(scene);
  }

  //結果表示画面
  function changeResultScene(){

  }

});