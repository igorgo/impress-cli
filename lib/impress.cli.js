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

// Start the CLI
//
cli.run = function() {
  console.log('Impress Application Server CLI'.green.bold);
  cli.exit();
};

// Release resources and exit
//
cli.exit = function() {
  cli.rl.close();
  process.chdir(cli.workingDir);
  process.exit(0);
};
