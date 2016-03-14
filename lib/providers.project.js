// Impress installation as a regular dependency
// of a Node project (useful for development:
// scaffolding and invokation of other project-specific
// commands, interaction with a development server etc)
impress.cli.providers.project = {};

var provider = impress.cli.providers.project;

provider.init = function(callback) {
  callback();
};
