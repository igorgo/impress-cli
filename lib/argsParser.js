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
 *      type: 'boolean',
 *      default: false
 *    },
 *    {
 *      fullName: 'port',
 *      shortName: 'p',
 *      type: 'number',
 *      default: 80
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
  'boolean': function(arg) {
    switch (arg.toLowerCase()) {
      case 'true':
        return true;
      case 'false':
        return false;
      default:
        return !!arg;
    }
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
      args.positional.push(argument);
      position++;
    }
  }
  
  // Initialize boolean arguments whose values are not specified as false
  args.schema.forEach(function(entry) {
    var name = entry.fullName || entry.shortName;
    if (args.named[name] === undefined) {
      args.named[name] = entry.default;
    }
  });
};

// Process a named argument and return a number of positions
// to advance through the arguments list
//
args.processNamed = function(argument, nextArgument, searchIndex) {
  var equalsIndex = argument.indexOf('='),
      key, value;
  if (equalsIndex != -1) {
    key = argument.slice(0, equalsIndex);
    value = argument.slice(equalsIndex + 1);
  } else {
    key = argument;
    value = nextArgument;
  }
  return args.processKeyValuePair(key, value, nextArgument, searchIndex);
};

// Process a named key-value pair after CLI argument has been parsed
//
args.processKeyValuePair = function(key, value, nextArgument, searchIndex) {
  var schemaEntry = searchIndex[key],
      name, type;
  if (schemaEntry) {
    name = schemaEntry.fullName || schemaEntry.shortName;
    type = schemaEntry.type || 'boolean';
  } else {
    name = key;
    type = 'boolean';
  }
  return args.processTypedPair(name, value, nextArgument, type);
};

// Process a named key-value pair after the data type
// has been determined
//
args.processTypedPair = function(name, value, nextArgument, type) {
  var parse = args.typeParsers[type];
  if (value) {
    args.named[name] = parse(value);
    return 1;
  }
  if (type === 'boolean') {
    args.named[name] = true;
    return 1;
  }
  args.named[name] = parse(nextArgument);
  return 2;
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
