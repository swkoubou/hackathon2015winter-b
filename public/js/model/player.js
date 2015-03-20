(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');
  var Model = Package.Model;

  var NAME_COLOR = '#009688';

  /*
    プレイヤークラス
    スコアと名前の保持と表示に関する処理など
  */
  Model.Player = enchant.Class.create({
    initialize: function(name, playerId, gameScene, tiles){
      var WIDTH = enchant.Core.instance.width;
      this.score = 0;
      this.name = name;
      this.tiles = new Model.Tiles(tiles);
      this.offsetX = (WIDTH / 2) * playerId;
      this.offsetY = Package.global.TOP_MARGIN;
      var that = this;
      var tileArray = [];
      console.log(gameScene);
      var group = new Group();
      _.each(this.tiles.getTileData(), function(row, y){
        // if(y == 1) return;
        _.each(row, function(tile, x){
          var xPos = x * Package.global.TILE_WIDTH + that.offsetX;
          var yPos = y * Package.global.TILE_HEIGHT;
          console.log(tile.getRightLeftColor());
          tile.moveTo(xPos, yPos);
          console.log(tile);
          // tile.backgroundColor = "#f0f";
          // tileArray.push(tile);
          group.addChild(tile);
          // var entity = new Entity();
          // entity.width = 64;
          // entity.height = 64;
          // entity.backgroundColor = "#f0f";
          // gameScene.addChild(entity);
        });
      });
      console.log("aaa");
      gameScene.addChild(group);

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