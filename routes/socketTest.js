var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    var logined = req.isAuthenticated && req.isAuthenticated();

    res.render('socketTest', {
        title: 'Express',
        logined: logined,
        user: req.user
    });
});

module.exports = router;
