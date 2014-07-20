'use strict';

var merge = require('merge');
var paramCase = require('param-case');
var pluralize = require('pluralize');

// value denotes mandatory/non-mandatory
var OPTION_PROPERTIES = {
  name: true,
  displayName: false,
  description: true,
  shortName: false,
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

function getMaxLength(propertyName, options) {
  var maxLength = 0;
  for (var name in options) {
    if (options.hasOwnProperty(name)) {
      var length = options[name][propertyName].length;
      if (length > maxLength) {
        maxLength = length;
      }
    }
  }

  return maxLength;
}

function displayProperty(string, maxLength) {
  var gap = 1 + maxLength - string.length;
  return string + new Array(gap).join(' ');
}

// TODO introduce colors
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
  var displayNameLength = getMaxLength('displayName', options);
  var shortNameLength = getMaxLength('shortName', options);

  Object.keys(options)
    .sort(function (a, b) {
      return a > b;
    })
    .forEach(function (name) {
      var value = options[name];
      out += '  ' + displayProperty(value.shortName, shortNameLength);
      out += '  ' + displayProperty(value.displayName, displayNameLength);
      if (value.description) {
        out += '    ' + value.description;
      }
      out += '\n';
    });

  console.log(out);
}

function validateOptions(options) {
  var shortOptions = {};

  Object.keys(options).forEach(function (name) {
    var option = options[name];

    var shortOption = shortOptions[option.shortName];
    if (shortOption) {
      throw new Error(
        'Short name conflict between \'' + shortOption.name + '\' & \'' +
        option.name + '\' options'
      );
    } else {
      shortOptions[option.shortName] = option;
    }

    if (option.default && option.required) {
      throw new Error(
        '\'default\' & \'required\' properties specified for \'' + name + '\''
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
  });
}

function shortCase(string) {
  var shortString = string[0];
  for (var i = 1; i < string.length; i++) {
    var c = string[i];
    if ((c >= 'A') && (c <= 'Z')) {
      shortString += c;
    }
  }
  return shortString.toLowerCase();
}

function initialiseOptions(options) {
  Object.keys(options).forEach(function (name) {
    var option = options[name];

    if (!Object.keys(option).length) {
      throw new Error('Missing properties for \'' + name + '\'');
    }

    option.name = name;

    if (!option.displayName) {
      option.displayName = '--' + paramCase(name);
    }

    /* jshint eqnull: true */
    if (option.default === null && !option.type) {
      option.type = 'boolean';
    }

    if (typeof option.default === 'boolean') {
      option.type = 'boolean';
    }

    option.required = option.type && option.type !== 'boolean';

    if (option.shortName !== null) {
      option.shortName = '-' + shortCase(option.name);
    }
  });
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

  initialiseOptions(this.options);
  validateOptions(this.options);

  this.displayNames = {};
  this.shortNames = {};

  for (var name in this.options) {
    if (this.options.hasOwnProperty(name)) {
      var option = this.options[name];
      this.displayNames[option.displayName] = option;
      this.shortNames[option.shortName] = option;
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

function cleanArgv(argv) {
  for (var i = 0; i < argv.length; i++) {
    if ((argv[i] === module.parent.filename) || (argv[i] === '--')) {
      return argv.slice(i + 1);
    }
  }
}

ArgvParser.prototype.parse = function (argv) {
  if (!argv) {
    argv = cleanArgv(process.argv);
  }
  if (!argv.length) {
    handleError(this);
    return;
  }
  var args = {};
  for (var i = 0; i < argv.length; i++) {
    var name = argv[i];
    var option = this.shortNames[name] || this.displayNames[name];
    if (!option) {
      throw new Error('Invalid argument: ' + name);
    }
  }

  return args;
};

module.exports = ArgvParser;

