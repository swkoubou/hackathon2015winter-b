var session = require('express-session');
var mongo = require('connect-mongo');
var config = require('config');

module.exports = session({
    name: config.session.name,
    secret: config.session.secret,
    store: new (mongo(session))(config.mongo),
    resave: true,
    saveUninitialized: false
});