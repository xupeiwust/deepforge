// Config for running deepforge w/ one local worker
// jshint node: true
'use strict';

var config = require('./config.default'),
    validateConfig = require('webgme/config/validator');

// Turn up the worker polling rate
config.executor.workerRefreshInterval = 150;
config.executor.clearOldDataAtStartUp = true,

validateConfig(config);
module.exports = config;
