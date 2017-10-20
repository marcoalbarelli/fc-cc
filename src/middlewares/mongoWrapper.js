'use strict';

const MongoClient = require('mongodb').MongoClient
const config = require('../../config');

const middleware = function () {
    return function (req, res, next) {
        res.on('finish', function () {
            req[config.mongo.propName].close();
        });

        MongoClient.connect(config.mongoConnectionUrl, function (err, conn) {
            req[config.mongo.propName] = conn;
            next(err);
        });
    };
};
module.exports = middleware
