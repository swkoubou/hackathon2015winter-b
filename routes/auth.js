var express = require('express');

module.exports = function (passport) {
    var router = express.Router();

    router.ensureAuthenticated = function (req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.redirect('/?mustlogin=1');
    };

    router.notEnsureAuthenticated = function (req, res, next) {
        if (!req.isAuthenticated()) { return next(); }
        res.redirect('/');
    };

    router.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    router.get('/twitter', passport.authenticate('twitter'));

    router.get('/twitter/callback', passport.authenticate('twitter', {failureRedirect: '/?mustlogin=1'}),
        function (req, res, next) {
            res.redirect('/');
        });

    return router;
};
