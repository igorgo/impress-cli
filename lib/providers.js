var cli = impress.cli;

// Impress Application Server providers
cli.providers = {};

require('./providers.server');
require('./providers.project');
require('./providers.remote');

cli.providers.initProviders = function(callback) {
  var initializers = Object.keys(cli.providers).filter(function(key) {
    return key !== 'initProviders';
  }).map(function (key) {
    return cli.providers[key].init;
  });
  api.async.parallel(initializers, callback);
};
