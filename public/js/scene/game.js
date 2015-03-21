(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');
  var Scenes = ns('swkoubou.hackathon2015winter.Scenes');
  var Model = ns('swkoubou.hackathon2015winter.Model');


  // ゲーム中画面
  Scenes.changeGame = function(gameInfo, p1, p2, endCallback){
    var timer = new Model.Timer();
    var SQUARE_STROKE_WIDTH = Package.global.SCREEN_BORDER_WIDTH;
    var LEFT_MARGIN = Package.global.LEFT_MARGIN;
    var TOP_MARGIN = Package.global.TOP_MARGIN;
    var game = enchant.Core.instance;
    var WIDTH = game.width;
    var SCREEN_HEIGHT = Package.global.SCREEN_HEIGHT;
    var player1, player2;
    game.addEventListener(enchant.Event.ENTER_FRAME, timer.update);
    if(endCallback){
      timer.setTimeUpCallback(endCallback);
    }

    var scene = new Scene();
    scene.backgroundColor = '#FFEBEE';

    timer.setSecondCallback(function(){
      var score = _.random(1, 100);
      player1.updateScore(score);
      score = _.random(1, 100);
      player2.updateScore(score);
    });
    timer.start(scene);

    var squareWidth = WIDTH - LEFT_MARGIN;
    var squareHeight = SCREEN_HEIGHT + Package.global.TOP_MARGIN + SQUARE_STROKE_WIDTH;
    var squareImage = new Sprite(squareWidth, squareHeight);
    var square = new Surface(squareWidth, squareHeight);
    square.context.strokeWidth = SQUARE_STROKE_WIDTH;
    square.context.beginPath();
    square.context.strokeStyle = '#004D40';
    square.context.strokeRect(LEFT_MARGIN, Package.global.TOP_MARGIN, squareWidth - LEFT_MARGIN - SQUARE_STROKE_WIDTH, squareHeight + Package.global.TOP_MARGIN);
    squareImage.image = square;

    var player1 = new Model.Player(p1.name, 0, scene, p1.tiles);
    var player2 = new Model.Player(p2.name, 1, scene, p2.tiles);
    game.replaceScene(scene);

    scene.addChild(squareImage);
  };
}).call(this);