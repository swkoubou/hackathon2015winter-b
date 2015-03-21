var express = require('express');
var router = express.Router();
<<<<<<< HEAD
var config = require('../config/default.json');
=======
var config = require('config');
>>>>>>> 1461b190ea08fbf4722ad7724ce881c3005cfa24

/* GET home page. */
router.get('/', function (req, res) {
    var mustLogin = req.params.mustLogin === '1';
    var logined = req.isAuthenticated && req.isAuthenticated();

    res.render('index', {
        title: config.title,
        mustLogin: mustLogin,
        logined: logined,
        user: req.user
    });
});

router.get('/game', function(req, res, next){
  res.render('game', config);

router.get('/lobby', function (req, res) {
    var logined = req.isAuthenticated && req.isAuthenticated();

    res.render('lobby', {
        title: config.title,
        user: req.user,
        logined: logined,
    });
});

module.exports = router;
