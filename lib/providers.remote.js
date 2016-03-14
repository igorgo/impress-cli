'use strict';

// Remote Impress via SSH (useful for, e.g., development
// on Windows while running Impress on a Linux VM)
impress.cli.providers.remote = {};

var provider = impress.cli.providers.remote;

provider.init = function(callback) {
  callback();
};
