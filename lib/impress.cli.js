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
  cli.loadAvailableCommands(function(err) {
    if (err) {
      console.error(err.toString().red.bold);
    }
    cli.exit();
  });
};

// Release resources and exit
//
cli.exit = function(code) {
  if (!code) code = 0;
  cli.rl.close();
  process.chdir(cli.workingDir);
  process.exit(code);
};

// Load all the available commands
//
cli.loadAvailableCommands = function(callback) {
  api.async.series([
    cli.loadCoreCommands,
    cli.loadProjectCommands,
  ], callback);
};

// Load the default commands that are a part of Impress CLI
//
cli.loadCoreCommands = function(callback) {
  cli.loadCommands(__dirname + '/commands', cli.commands, callback);
};

// Load the custom commands any Impress Application can optionally provide
//
cli.loadProjectCommands = function(callback) {
  callback();
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
  api.fs.lstat(commandLocation, function(err, stat) {
    if (err) return callback(err);
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
    var command = api.path.basename(location, '.cmd'),
        scriptPath = api.path.join(location, 'action.js'),
        sandbox = cli.createSandbox(scriptPath, config);
    cli.createCommandHandler(scriptPath, sandbox, function(err, handler) {
      if (err) return callback(err);
      mountPoint[command] = handler;
      callback();
    });
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

// Create a sandbox environment for a command
//
cli.createSandbox = function(scriptPath, config) {
  var context = {
    Buffer: Buffer,
    __dirname: api.path.dirname(scriptPath),
    __filename: api.path.basename(scriptPath),
    clearInterval: clearInterval,
    clearTimeout: clearTimeout,
    console: console,
    setInterval: setInterval,
    setTimeout: setTimeout,
    module: {
      exports: function() {
        console.error('The command defined no action'.bold.red);
      }
    },
    process: process,
    impress: {
      cli: {
        packageInfo: cli.packageInfo,
        isWin: cli.isWin,
        workingDir: cli.workingDir,
        rl: cli.rl,
        args: cli.args,
        exit: cli.exit
      }
    }
  };
  context.global = context;
  context.exports = context.module.exports;
  
  var sandbox = api.vm.createContext(context);
  return sandbox;
};

// Create a command handler function given a script location
// and a sandbox environment
//
cli.createCommandHandler = function(scriptPath, sandbox, callback) {
  api.fs.readFile(scriptPath, function(err, source) {
    if (err) return callback(err);
    var script = api.vm.createScript(source, scriptPath);
    script.runInNewContext(sandbox);
    callback(null, sandbox.module.exports);
  });
};
