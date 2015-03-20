$(function(){
  'use strict';
  enchant();
  var WIDTH = 1400;
  var HEIGHT = 800;
  var FONT_PROP = '/1.5 "Noto sans"';
  var NAME_COLOR = '#009688';
  var LEFT_MARGIN = 40;
  var RIGHT_MARGIN = 40;
  var TOP_MARGIN = 100;
  var CELL_HEIGHT = 64;
  var CELL_WIDTH = 64;
  var FINISH_TEXT_SHOW_TIME = 3;
  var SQUARE_STROKE_WIDTH = 3;

  /*
    プレイヤークラス
    スコアと名前の保持と表示に関する処理など
  */
  var Player = Class.create({
    initialize: function(name, playerId, gameScene){
      this.score = 0;
      this.name = name;
      this.offset = (WIDTH / 2) * playerId;

      var scoreLabel = new NotoLabel('200%');
      this.scoreLabel = scoreLabel;
      scoreLabel.color = '#009688';
      this.updateScore(this.score);
      scoreLabel.moveTo(this.computeCenterTextPos(scoreLabel), 18);

      var nameLabel = new NotoLabel('200%');
      nameLabel.color = NAME_COLOR;
      nameLabel.text = name;
      nameLabel.moveTo(this.computeCenterTextPos(nameLabel), 48);
      this.nameLabel = nameLabel;
      
      gameScene.addChild(nameLabel);
      gameScene.addChild(scoreLabel);
    },

    computeCenterTextPos : function(label){
      return ((WIDTH / 2) - label._boundWidth) / 2 + this.offset + LEFT_MARGIN;
    },

    updateScore: function(score){
      this.score += score;
      this.scoreLabel.text = 'Score: ' + this.score;
      this.scoreLabel.x = this.computeCenterTextPos(this.scoreLabel);
    },

    getNameLabel: function(){
      return this.nameLabel;
    },
  });

  // Notoフォントで表示するためだけのクラス
  var NotoLabel = Class.create(Label, {
    initialize: function(fontSize){
      Label.call(this);
      fontSize = fontSize || '100%';
      this.font = fontSize.toString() + FONT_PROP;
    }
  });

  // 残り時間に関して処理を行うクラス 残り時間の管理と表示のアップデート
  var Timer = Class.create({
    TIME_LIMIT: 5,
    initialize: function(){
      this.time = this.TIME_LIMIT;
      this.game = enchant.Core.instance;
    },
    update: function(){
      var progress = parseInt(this.game.frame / this.game.fps);
      var remain = this.TIME_LIMIT - progress;
      return this.time = remain;
    },
    getRemainingTime: function(){
      return this.time;
    },
    start: function(){
      this.game.frame = 0;
    },
    getPlayTime: function(){
      return this.TIME_LIMIT;
    }
  });

  // global variables
  var timeLabel = new NotoLabel('500%');
  var game = new Core(WIDTH, HEIGHT);
  var timer = new Timer();

  init();

  function init(){
    game.preload(); // load game resource
    game.fps = 60;
    game.players = {};
    timeLabel.color = '#F44336';
    timeLabel.text = timer.getPlayTime();
    timeLabel.moveTo((WIDTH - timeLabel._boundWidth) / 2, 10);
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
    timer.start();
    game.addEventListener(enchant.Event.ENTER_FRAME, countDownCallback);
    var scene = new Scene();
    scene.backgroundColor = '#FFEBEE';
    game.replaceScene(scene);
    scene.addChild(timeLabel);
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
    if(remain < 0){
      game.removeEventListener(enchant.Event.ENTER_FRAME, countDownCallback);
      showFinishText();
      setTimeout(function(){
        changeResultScene();
      }, FINISH_TEXT_SHOW_TIME);
    }else{
      timeLabel.text = remain;
    }
  }

  function showFinishText(){
    // game finish
    var finishText = new NotoLabel('600%');
    finishText.text = 'Finish!';
    finishText.color = '#FF5722';
    finishText.moveTo((WIDTH - finishText._boundWidth) / 2,
    (HEIGHT - finishText._boundHeight) / 2);
    game.currentScene.addChild(finishText);
  }

  //結果表示画面
  function changeResultScene(){

  }

});