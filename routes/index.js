var express = require('express');
var router = express.Router();
var config = require('../config/default.json');

/* GET home page. */
router.get('/', function (req, res, next) {
    var mustLogin = req.params.mustLogin === '1';
    var logined = req.isAuthenticated && req.isAuthenticated();

    res.render('index', {
        title: 'Express',
        mustLogin: mustLogin,
        logined: logined,
        user: req.user
    });
});

router.get('/game', function(req, res, next){
  res.render('game', config);
});

module.exports = router;
