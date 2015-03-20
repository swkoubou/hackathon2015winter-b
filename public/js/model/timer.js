(function(){
  'use strict';
  var Package = ns('swkoubou.hackathon2015winter');
  var Model = Package.Model;

  // 残り時間に関して処理を行うクラス 残り時間の管理と表示のアップデート
  Model.Timer = enchant.Class.create({
    TIME_LIMIT: 60,
    CIRCLE_SIZE: 80,
    TIMER_COLOR: '#F44336',
    TIMER_BORDER_WIDTH: 5,
    initialize: function(){
      _.bindAll(this, 'update');
      this.time = this.TIME_LIMIT;
      this.game = enchant.Core.instance;
      this.endCallback = _.noop;
      this.timerLabel = new Model.NotoLabel('400%');
      this.timerLabel.color = this.TIMER_COLOR;
      this.timerLabel.text = this.TIME_LIMIT;
      this.timerLabel.textAlign = 'center';
      this.timerLabel.width = Package.global.WIDTH;
      this.timerLabel.moveTo(0, 18);

      this.circleWrapperSize = this.CIRCLE_SIZE + this.TIMER_BORDER_WIDTH * 2;
      var circle = new Surface(this.circleWrapperSize, this.circleWrapperSize);
      var sprite = new Sprite(this.circleWrapperSize, this.circleWrapperSize);
      circle.context.lineWidth = this.TIMER_BORDER_WIDTH;
      circle.context.strokeStyle = this.TIMER_COLOR;
      this.center = this.CIRCLE_SIZE / 2 + this.TIMER_BORDER_WIDTH;
      sprite.image = circle;
      this.circle = circle;
      sprite.moveTo((Package.global.WIDTH - this.CIRCLE_SIZE - this.TIMER_BORDER_WIDTH) / 2, 12 - this.TIMER_BORDER_WIDTH);
      this.circleSprite = sprite;
    },
    update: function(){
      var progressFloat = this.game.frame / this.game.fps;
      var progress = Math.ceil(progressFloat);
      var remain = this.TIME_LIMIT - progress;
      this.circle.context.clearRect(0, 0, this.circleWrapperSize, this.circleWrapperSize);
      this.circle.context.beginPath();
      this.circle.context.arc(this.center, this.center, this.CIRCLE_SIZE / 2, -Math.PI/ 2, Math.PI * 2 - (progressFloat / this.TIME_LIMIT * Math.PI * 2) - Math.PI / 2, false);
      this.circle.context.stroke();
      if(this.prev !== remain){
        this.timerLabel.text = remain;
      }
      this.prev = remain;
      if(remain === 0){
        this.end();
      }
      return this.time = remain;
    },
    getRemainingTime: function(){
      return this.time;
    },
    setTimeUpCallback: function(callback){
      this.endCallback = callback;
    },
    start: function(scene){
      scene.addChild(this.circleSprite);
      this.game.frame = 0;
      scene.addChild(this.timerLabel);
    },
    end: function(){
      if(this.endCallback) this.endCallback();
    },
    getPlayTime: function(){
      return this.TIME_LIMIT;
    }
  });
}).call(this);