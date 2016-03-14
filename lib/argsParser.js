'use strict';

// Command-line arguments parser
impress.cli.args = {
  positional: [],
  named: {},
  schema: []
};

/**
 *  Example of schema definition:
 *
 *  [
 *    {
 *      fullName: 'help',
 *      shortName: 'h',
 *      type: 'boolean'
 *    },
 *    {
 *      fullName: 'port',
 *      shortName: 'p',
 *      type: 'number'
 *    }
 *  ]
 */

var args = impress.cli.args;

// Parsers of available data types
//
args.typeParsers = {
  'string': function(arg) {
    return arg;
  },
  'number': function(arg) {
    return +arg;
  },
  'fileStream': function(arg) {
    return api.fs.createReadStream(arg);
  },
  'fileData': function(arg) {
    return api.fs.readFileSync(arg); // warning: synchronous
  }
};

// Add a new schema definition to the global one
//
args.addSchema = function(partialSchema) {
  partialSchema.forEach(function(entry) {
    args.schema.push(entry);
  });
};

// Parse arguments
//
args.parse = function() {
  var fullNameIndex = args.buildSchemaIndex('fullName'),
      shortNameIndex = args.buildSchemaIndex('shortName'),
      position = 2;
  
  while (position < process.argv.length) {
    var argument = process.argv[position],
        nextArgument = process.argv[position + 1];
    if (argument.startsWith('--')) {
      position += args.processNamed(argument.slice(2), nextArgument, fullNameIndex);
    } else if (argument.startsWith('-')) {
      position += args.processNamed(argument.slice(1), nextArgument, shortNameIndex);
    } else {
      args.processPositional(argument);
      position++;
    }
  }
  
  // Initialize boolean arguments whose values are not specified as false
  args.schema.forEach(function(entry) {
    var name = entry.fullName || entry.shortName;
    if (entry.type === 'boolean' &&
        args.named[name] === undefined) {
      args.named[name] = false;
    }
  });
};

// Process a named argument and return a number of positions
// to advance through the arguments list
//
args.processNamed = function(argument, nextArgument, searchIndex) {
  var schemaEntry = searchIndex[argument],
      name,
      type;
  if (schemaEntry) {
    name = schemaEntry.fullName;
    type = schemaEntry.type;
  } else {
    name = argument;
    type = 'boolean';
  }
  
  if (type === 'boolean') {
    args.named[name] = true;
    return 1;
  }
  args.named[name] = args.typeParsers[type](nextArgument);
  return 2;
};

// Process a positional argument
//
args.processPositional = function(argument) {
  args.positional.push(argument);
};

// Build a search index by a unique field for the schema
// (essentially, turns an array of objects into a hash that
// holds these objects)
//
args.buildSchemaIndex = function(key) {
  var index = {};
  args.schema.forEach(function(schemaEntry) {
    var value = schemaEntry[key];
    // Don't allow redefinitions: schema entries
    // defined earlier have priviledge
    if (!index[value]) {
      index[value] = schemaEntry;
    }
  });
  return index;
};
