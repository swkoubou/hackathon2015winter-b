var express = require('express');
var router = express.Router();

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

module.exports = router;
