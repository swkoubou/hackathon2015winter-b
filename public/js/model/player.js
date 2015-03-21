(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');
  var Model = ns('swkoubou.hackathon2015winter.Model');

  var NAME_COLOR = '#009688';

  /*
    プレイヤークラス
    スコアと名前の保持と表示に関する処理など
  */
  Model.Player = enchant.Class.create({
    initialize: function(name, playerId, gameScene, tiles){
      var WIDTH = enchant.Core.instance.width;
      var TOP_MARGIN = Package.global.TOP_MARGIN;
      var LEFT_MARGIN = Package.global.LEFT_MARGIN;
      this.score = 0;
      this.name = name;
      this.tiles = new Model.Tiles(tiles);
      this.offsetX = (WIDTH / 2) * playerId;
      this.offsetY = Package.global.TOP_MARGIN;
      var that = this;
      var tileArray = [];
      console.log(gameScene);
      var tileGroup = new Group();
      _.each(this.tiles.getTileData(), function(row, y){
        // if(y == 1) return;
        _.each(row, function(block, x){
          var xPos = x * Package.global.TILE_WIDTH;
          var yPos = y * Package.global.TILE_HEIGHT;
          var groupBlock = block.getGroup();
          groupBlock.moveTo(xPos, yPos);
          tileGroup.addChild(groupBlock);
        });
      });
      var tileGroupWidth = tileGroup.width;
      console.log(tileGroupWidth);
      var tilePos = {
        x: playerId === 0 ? LEFT_MARGIN : (WIDTH + Package.global.GAP) / 2 - Package.global.SCREEN_BORDER_WIDTH,
        y: TOP_MARGIN
      };
      tileGroup.moveTo(tilePos.x, tilePos.y);
      gameScene.addChild(tileGroup);

      var scoreLabel = new Model.NotoLabel('200%');
      this.scoreLabel = scoreLabel;
      scoreLabel.color = '#009688';
      scoreLabel.textAlign = 'center';
      scoreLabel.width = WIDTH / 2;
      this.updateScore(this.score);
      var textPos = WIDTH / 2 * playerId;
      scoreLabel.moveTo(textPos, 18);

      var nameLabel = new Model.NotoLabel('200%');
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