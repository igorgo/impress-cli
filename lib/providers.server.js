'use strict';

// Globally installed Impress instance
impress.cli.providers.server = {};

var provider = impress.cli.providers.server;

// Shows warning about IAS not being installed, but only once
//
function notInstalledWarning(callback) {
  var fileName = api.path.join(impress.cli.homeDir, '.impress-not-installed-warning');
  api.fs.exists(fileName, function(exists) {
    if (!exists) {
      impress.cli.warning('Impress Application Server not installed');
      api.fs.writeFile(fileName, '');
    }
    callback();
  });
}

// Initialize the provider
//
provider.init = function(callback) {
  api.fs.readFile(impress.cli.location + '/impress.link', function(err, loc) {
    if (err) {
      provider.impressPath = null;
      notInstalledWarning(callback);
    } else {
      provider.impressPath = loc;
      callback();
    }
  });
};
