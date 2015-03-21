(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');
  var Model = ns('swkoubou.hackathon2015winter.Model');

  Model.Tiles = enchant.Class.create({
    TILE_WIDTH: 10,
    initialize: function(tiles){
      this.tiles = [];
      for(var i = 0; this.TILE_WIDTH > i; i++){
        for(var j = 0; this.TILE_WIDTH > j; j++){
          if(j === 0) this.tiles[i] = [];
          this.tiles[i][j] = tiles[i * this.TILE_WIDTH + j];
        }
      }
    },

    getTileData: function(){
      return this.tiles;
    },

    isRemovable: function(x, y, color){
      var cell = this.tiles[y][x];
      return (cell.getRightLeftColor() === color || cell.getLeftRightColor());
    }
  });
}).call(this);