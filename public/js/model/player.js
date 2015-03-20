(function(){
  'use strict';
  var Model = ns('swkoubou.hackathon2015winter.Model');

  var NAME_COLOR = '#009688';

  /*
    プレイヤークラス
    スコアと名前の保持と表示に関する処理など
  */
  Model.Player = Class.create({
    initialize: function(name, playerId, gameScene){
      this.score = 0;
      this.name = name;
      this.offset = (WIDTH / 2) * playerId;

      var scoreLabel = new NotoLabel('200%');
      this.scoreLabel = scoreLabel;
      scoreLabel.color = '#009688';
      scoreLabel.textAlign = 'center';
      scoreLabel.width = WIDTH / 2;
      this.updateScore(this.score);
      var textPos = WIDTH / 2 * playerId;
      scoreLabel.moveTo(textPos, 18);

      var nameLabel = new NotoLabel('200%');
      nameLabel.color = NAME_COLOR;
      nameLabel.text = name;
      nameLabel.textAlign = 'center';
      nameLabel.width = WIDTH / 2;
      nameLabel.moveTo(textPos, 48);
      this.nameLabel = nameLabel;
      
      gameScene.addChild(nameLabel);
      gameScene.addChild(scoreLabel);
    },

    updateScore: function(score){
      this.score += score;
      this.scoreLabel.text = 'Score: ' + this.score;
    },

    getNameLabel: function(){
      return this.nameLabel;
    },
  });
}).call(this);