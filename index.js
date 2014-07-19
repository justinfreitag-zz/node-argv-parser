'use strict';

var merge = require('merge');
var paramCase = require('param-case');
var pluralize = require('pluralize');

// value denotes mandatory/non-mandatory
var OPTION_PROPERTIES = {
  name: true,
  showName: false,
  description: true,
  alias: false,
  type: false,
  required: false,
  default: false
};

var OPTION_TYPES = [
  'string',
  'boolean',
  'integer',
  'float',
  'number'
];

function showHelp(parser) {
  var out = '';

  if (parser.banner) {
    out += parser.banner + '\n';
  }
  out += '\n';

  var usage = parser.usage || (process.argv[0] + ' [options]');
  out += 'Usage: ' + usage + '\n\n';

  out += 'Options:\n\n';

  var options = parser.options;
  var names = Object.keys(options);
  names.sort(function (a, b) {
    return options[b].showName.length - options[a].showName.length;
  });
  var maxNameLength = options[names[0]].showName.length;
  names
    .sort(function (a, b) {
      return a > b;
    })
    .forEach(function (name) {
      var value = options[name];
      out += '  ';
      if (value.alias) {
        out += '-' + value.alias;
      } else {
        out += '  ';
      }
      var gap = 1 + maxNameLength - value.showName.length;
      out += ' --' + value.showName + new Array(gap).join(' ');
      if (value.description) {
        out += '  ' + value.description;
      }
      out += '\n';
    });

  console.log(out);
}

function validateOption(option) {
  var name = option.name;

  if (option.default && option.required) {
    throw new Error(
      '\'default\' and \'required\' properties specified for \'' + name + '\''
    );
  }

  var invalidProperties = [];
  Object.keys(option).forEach(function (key) {
    if (!(key in OPTION_PROPERTIES)) {
      invalidProperties.push(key);
    }
  });

  if (invalidProperties.length) {
    throw new Error(
      'Invalid ' + pluralize('property', invalidProperties.length) +
      ' specified for \'' + name + '\': ' + invalidProperties.toString()
    );
  }

  if (OPTION_TYPES.indexOf(option.type) === -1) {
    throw new Error(
      'Invalid type \'' + option.type + '\' specified for \'' + name + '\''
    );
  }
}

function initialiseOption(name, option) {
  if (!Object.keys(option).length) {
    throw new Error('Missing properties for \'' + name + '\'');
  }

  option.name = name;

  if (!option.showName) {
    option.showName = paramCase(name);
  }

  /* jshint eqnull: true */
  if (option.default === null && !option.type) {
    option.type = 'boolean';
  }

  if (typeof option.default === 'boolean') {
    option.type = 'boolean';
  }

  option.required = option.type && option.type !== 'boolean';

  if (option.alias !== null) {
    option.alias = option.name[0];
  }

  validateOption(option);
}

var DEFAULT_OPTIONS = {
  help: {
    description: 'This help text',
    type: 'boolean',
    required: false,
    default: false
  }
};

function ArgvParser(options) {
  this.options = merge(DEFAULT_OPTIONS, options);

  for (var name in this.options) {
    if (this.options.hasOwnProperty(name)) {
      initialiseOption(name, this.options[name]);
    }
  }
}

// TODO add domain to capture errors thrown
function handleError(parser, error) {
  if (error) {
    console.log(error.message);
  }
  showHelp(parser);
  process.exit(0);
}

ArgvParser.prototype.parse = function (argv) {
  if (!argv) {
    argv = process.argv;
  }
  // TODO handle shebangs and mocha, etc.
  if (argv.length <= 7) {
    handleError(this);
    return;
  }
  var args = {};
  for (var i = 7; i < argv.length; i++) {
    var option = this.options[argv[i]];
    if (!option) {
      throw new Error('Invalid argument: ' + argv[i]);
    }
  }

  return args;
};

module.exports = ArgvParser;

