var express = require('express');
var router = express.Router();
var app = require('../app');
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/game', function(req, res, next){
  res.render('game', app.GAME_NAME);
});

module.exports = router;
