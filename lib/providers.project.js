// Impress installation as a regular dependency
// of a Node project (useful for development)
impress.cli.providers.project = {};

var provider = impress.cli.providers.project;

provider.init = function(callback) {
  callback();
};
