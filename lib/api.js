'use strict';

if (!global.api) global.api = {};

// Load Node core libraries
api.os = require('os');
api.fs = require('fs');
api.vm = require('vm');
api.path = require('path');
api.readline = require('readline');
api.childProcess = require('child_process');

// Load third-party packages
//
api.loadDependencies = function() {
  for (var lib in impress.cli.packageInfo.dependencies) {
    api[lib] = require(lib);
  }
};
