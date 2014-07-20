'use strict';

var clone = require('node-v8-clone').clone;
var merge = require('merge');
var paramCase = require('param-case');
var pluralize = require('pluralize');

// value denotes mandatory/non-mandatory
var OPTION_PROPERTIES = {
  name: true,
  longName: false,
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
  var longNameLength = getMaxLength('longName', options);
  var shortNameLength = getMaxLength('shortName', options);

  Object.keys(options)
    .sort(function (a, b) {
      return a > b;
    })
    .forEach(function (name) {
      var value = options[name];
      out += '  ' + displayProperty(value.shortName, shortNameLength);
      out += '  ' + displayProperty(value.longName, longNameLength);
      if (value.description) {
        out += '    ' + value.description;
      }
      out += '\n';
    });

  console.log(out);
}

function validateProperties(option) {
  var invalidProperties = [];
  Object.keys(option).forEach(function (key) {
    if (!(key in OPTION_PROPERTIES)) {
      invalidProperties.push(key);
    }
  });

  if (invalidProperties.length) {
    throw new Error(
      'Invalid ' + pluralize('property', invalidProperties.length) +
      ' specified for \'' + option.name + '\': ' + invalidProperties.toString()
    );
  }
}

function validateShortName(shortOption, shortOptions) {
  var option = shortOptions[shortOption.name];
  if (option) {
    throw new Error(
      'Short name conflict between \'' + shortOption.name + '\' & \'' +
      option.name + '\' options'
    );
  }
}

function validateType(option) {
  if (OPTION_TYPES.indexOf(option.type) === -1) {
    throw new Error(
      'Invalid type \'' + option.type + '\' for \'' + option.name + '\''
    );
  }
}

function validatePropertyMix(option) {
  if (option.default && option.required) {
    throw new Error(
      '\'default\' & \'required\' properties for \'' + option.name + '\''
    );
  }
}

function validateOptions(options) {
  var shortOptions = {};

  Object.keys(options).forEach(function (name) {
    var option = options[name];

    validateShortName(option, shortOptions);
    shortOptions[option.shortName] = option;

    validatePropertyMix(option);

    validateProperties(option);

    validateType(option);
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

    if (!option.longName) {
      option.longName = '--' + paramCase(name);
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

function handleParseError(parser, error) {
  if (error) {
    console.log(error.message);
  }
  showHelp(parser);
  process.exit(!error);
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

  this.longNames = {};
  this.shortNames = {};
  this.values = {};
  for (var name in this.options) {
    if (this.options.hasOwnProperty(name)) {
      var option = this.options[name];
      this.longNames[option.longName] = option;
      this.shortNames[option.shortName] = option;
      if (option.required) {
        this.values[option.name] = undefined;
      }
      if (option.default) {
        this.values[option.name] = option.default;
      }
    }
  }
}

function prepareArgv(argv) {
  if (!argv) {
    argv = process.argv;
  }

  for (var i = 0; i < argv.length; i++) {
    if ((argv[i] === module.parent.filename) || (argv[i] === '--')) {
      argv = argv.slice(i + 1);
      break;
    }
  }

  return argv.map(function (arg) {
    if (arg.indexOf('-')) {
      return arg.split('=', 1);
    }
    return arg;
  });
}

function isInteger(n) {
  return typeof n === 'number' && (n % 1 === 0);
}

function convertNumber(value) {
  if (isInteger(value)) {
    return parseInt(value);
  }
  return parseFloat(value);
}

function convertType(type, value) {
  switch (type) {
    case 'integer':
      return parseInt(value, 10);
    case 'float':
      return parseFloat(value, 10);
    case 'number':
      return convertNumber(value);
    default:
      return value;
  }
}

function parseValue(parser, value, type, arg) {
  if ((value === undefined) || (value.indexOf('-') === 0)) {
    return handleParseError(
      parser,
      'Missing \'' + type + '\' for argument: \'' + arg + '\''
    );
  }
  try {
    value = convertType(type, value);
  } catch (error) {
    return handleParseError(
      parser,
      'Expected \'' + type + '\' for argument: \'' + arg + '\''
    );
  }
  return value;
}

function checkForRequired(parser, values, options) {
  for (var name in values) {
    if (values.hasOwnProperty(name)) {
      if (values[name] === undefined) {
        return handleParseError(
          parser,
          'Expected argument: \'' + options[name].shortName + '\''
        );
      }
    }
  }
}

ArgvParser.prototype.parse = function (argv) {
  argv = prepareArgv(argv);
  var values = clone(this.values);

  /* jshint boss: true */
  var arg;
  while (arg = argv.shift()) {
    var option = this.shortNames[arg] || this.longNames[arg];
    if (!option) {
      return handleParseError(this, 'Unknown argument: \'' + arg + '\'');
    }
    if (option.type === 'boolean') {
      values[option.name] = true;
    } else {
      values[option.name] = parseValue(this, argv.shift(), option.type, arg);
    }
  }

  checkForRequired(values, this.options);

  return values;
};

module.exports = ArgvParser;

