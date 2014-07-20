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

function getMaxLength(property, options) {
  var maxLength = 0;
  Object.keys(options).forEach(function (name) {
    var length = options[name][property].length;
    if (length > maxLength) {
      maxLength = length;
    }
  });
  return maxLength;
}

function fillOptionProperty(property, maxLength) {
  return property + new Array(1 + maxLength - property.length).join(' ');
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

  var options = parser.options;
  var longNameLength = getMaxLength('longName', options);
  var shortNameLength = getMaxLength('shortName', options);

  out += 'Options:\n\n';
  Object.keys(options)
    .sort(function (a, b) {
      return a > b;
    })
    .forEach(function (name) {
      var value = options[name];
      out += '  ' + fillOptionProperty(value.shortName, shortNameLength);
      out += '  ' + fillOptionProperty(value.longName, longNameLength);
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

    var shortOption = shortOptions[option.name];
    if (shortOption) {
      throw new Error(
        'Short name conflict between \'' + shortOption.name + '\' & \'' +
        option.name + '\' options'
      );
    }
    shortOptions[option.shortName] = option;

    var invalidProperties = [];
    Object.keys(option).forEach(function (key) {
      if (!(key in OPTION_PROPERTIES)) {
        invalidProperties.push(key);
      }
    });

    if (invalidProperties.length) {
      throw new Error(
        'Invalid ' + pluralize('property', invalidProperties.length) +
        ' specified for \'' + option.name + '\': ' +
        invalidProperties.toString()
      );
    }

    if (OPTION_TYPES.indexOf(option.type) === -1) {
      throw new Error(
        'Invalid type \'' + option.type + '\' for \'' + option.name + '\''
      );
    }

    if (option.default && option.required) {
      throw new Error(
        '\'default\' & \'required\' properties for \'' + option.name + '\''
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

function createDefaults(options) {
  var defaults = {};
  Object.keys(options).forEach(function (name) {
    var option = options[name];
    if (option.default !== undefined || option.required) {
      defaults[option.name] = option.default;
    }
 });
  return defaults;
}

function createLookup(options, propertyName) {
  var references = {};
  Object.keys(options).forEach(function (name) {
    var option = options[name];
    references[option[propertyName]] = options[name];
  });
  return references;
}

function initialiseOptions(options) {
  Object.keys(options).forEach(function (name) {
    var option = options[name];

    if (!Object.keys(option).length) {
      throw new Error('Missing properties for \'' + name + '\'');
    }

    option.name = name;

    if (!option.longName) {
      option.longName = '--' + paramCase(option.name);
    }

    if (option.shortName !== null) {
      option.shortName = '-' + shortCase(option.name);
    }

    /* jshint eqnull: true */
    if (!option.type && option.default != null) {
      option.type = typeof option.default;
    }

    option.required = option.required && option.type !== 'boolean';
  });
}

function handleParseError(parser, error) {
  if (error) {
    console.log(error);
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

  this.longNames = createLookup(this.options, 'longName');
  this.shortNames = createLookup(this.options, 'shortName');

  this.defaults = createDefaults(this.options);
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

  return argv;
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
  if (value === undefined || (value.indexOf('-') === 0)) {
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

function valuesRequired(values) {
  return Object.keys(values).some(function (name) {
    return values[name] === undefined;
  });
}

function missingValues(options, values) {
  var missing = [];
  Object.keys(values).forEach(function (name) {
    if (values[name] === undefined) {
      missing.push(options[name].longName);
    }
  });
  return missing;
}

ArgvParser.prototype.parse = function (argv) {
  /* jshint maxcomplexity: false */

  var values = clone(this.defaults);
  values.argv = argv = prepareArgv(argv);

  while (argv.length && !argv[0].indexOf('-')) {
    var arg = argv.shift();
    var option = this.shortNames[arg] || this.longNames[arg];
    if (!option) {
      return handleParseError(this, 'Unknown argument: \'' + arg + '\'');
    }
    if (option.type === 'boolean') {
      values[option.name] = true;
    } else {
      values[option.name] = parseValue(this, argv.shift(), option.type, arg);
    }
    if (option.name === 'help') {
      return handleParseError(this);
    }
  }

  if (valuesRequired(values)) {
    return handleParseError(
      this, 'Expected arguments: ' + missingValues(this.options, values)
    );
  }

  return values;
};

module.exports = ArgvParser;

