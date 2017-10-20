'use strict'

require('dotenv').config()
const express = require('express');
const logger = require('express-pino-logger')();
const bodyParser = require('body-parser');

const app = express();

app.use(logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const index = require('./routes/index')
app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = process.env.ENVIRONMENT_TYPE === 'development' ? err : {};

  // return the error code
  res.status(err.status || 500);
  res.send('error');
});

module.exports = app;
