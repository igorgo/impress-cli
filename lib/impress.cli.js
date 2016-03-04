'use strict';

// Impress CLI
//
var cli = {};

if (!global.impress) global.impress = {};
impress.cli = cli;

require('./api');
require('./constants');

cli.packageInfo = require(api.path.dirname(__dirname) + '/package.json');
api.loadDependencies();

cli.isWin = !!process.platform.match(/^win/);

api.ncp.limit = cli.NCP_LIMIT;

cli.workingDir = process.cwd();

cli.rl = api.readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

cli.args = api.minimist(process.argv.slice(2));

// A hash of all the available commands
cli.commands = {};

// Start the CLI
//
cli.run = function() {
  console.log('Impress Application Server CLI'.green.bold);
  cli.loadAvailableCommands();
  console.log(cli.args);
  cli.exit();
};

// Release resources and exit
//
cli.exit = function() {
  cli.rl.close();
  process.chdir(cli.workingDir);
  process.exit(0);
};

// Load all the available commands
//
cli.loadAvailableCommands = function() {
  cli.loadCoreCommands();
  cli.loadProjectCommands();
};

// Load the default commands that are a part of Impress CLI
//
cli.loadCoreCommands = function() {
  cli.loadCommands(__dirname + '/commands', cli.commands);
};

// Load the custom commands any Impress Application can optionally provide
//
cli.loadProjectCommands = function() {
  
};

// Load the command plugins
//
cli.loadCommands = function(location, mountPoint, callback) {
  api.fs.readdir(location, function(err, commands) {
    if (err) return callback(err);
    api.async.each(commands, function (command, cb) {
      cli.loadCommand(location, command, mountPoint, cb);
    }, callback);
  });
};

// Load a single command
//
cli.loadCommand = function(location, command, mountPoint, callback) {
  var commandLocation = api.path.join(location, command);
  api.fs.lstat(commandLocation, function(stat) {
    if (!stat.isDirectory()) return callback();
    if (commandLocation.endsWith('.cmd')) {
      cli.loadCommandHandler(commandLocation, mountPoint, callback);
    } else {
      mountPoint[command] = {};
      cli.loadCommands(commandLocation, mountPoint[command], callback);
    }
  });
};

// Load a command handler
//
cli.loadCommandHandler = function(location, mountPoint, callback) {
  cli.loadHandlerConfig(location, function(err, config) {
    if (err) return callback(err);
  });
};

// Load the configuration of a handler
//
cli.loadHandlerConfig = function(location, callback) {
  var configPath = api.path.join(location, 'command.json'),
      defaultConfig = {
        inject: []
      };
  api.fs.readFile(configPath, function(err, data) {
    if (err) return callback(null, defaultConfig);
    else {
      try {
        var config = JSON.parse(data);
        Object.keys(defaultConfig).forEach(function(key) {
          if (typeof(config[key]) === 'undefined') {
            config[key] = defaultConfig[key];
          }
        });
        callback(null, config);
      } catch (error) {
        callback(error, null);
      }
    }
  });
};
