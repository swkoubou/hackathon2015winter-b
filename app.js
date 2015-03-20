var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var mongoose = require('mongoose');
var config = require('config');
var sessionMiddleware = require('./lib/module/sessionMiddleware');

// mongoose
mongoose.connect(config.mongo.url);

// passport
passport.use(new TwitterStrategy({
        consumerKey: config.twitter.consumer.key,
        consumerSecret: config.twitter.consumer.secret,
        callbackURL: config.twitter.callbackURL
    },
    function (token, tokenSecret, profile, done) {
        var user =  profile;
        user.token = token;
        user.tokenSecret = tokenSecret;
        done(null, user);
    }
));
passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(path.join(__dirname, 'public')));

// routing
var index = require('./routes/index');
var auth = require('./routes/auth')(passport);

app.use('/', index);
app.use('/auth', auth);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
