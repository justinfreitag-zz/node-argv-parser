'use strict';

var clone = require('node-v8-clone').clone;
var help = require('./lib/help');
var merge = require('deepmerge');
var paramCase = require('param-case');
var format = require('util').format;

var OPTION_PROPERTIES = [
  'id',
  'longId',
  'shortId',
  'description',
  'required',
  'type',
  'hint',
  'value',
  'multiple',
  'parse',
  'validate'
];

var ARGUMENT_TYPES = [
  'string',
  'boolean',
  'number'
];

var OPERAND_PROPERTIES = [
  'id',
  'description',
  'type',
  'hint',
  'required',
  'value',
  'multiple',
  'parse',
  'validate'
];

var INVALID_PROPERTY = 'Unknown property \'%s\' for \'%s\'';
var ID_CONFLICT = 'ID conflict between between \'%s\' and \'%s\'';
var INVALID_TYPE = 'Invalid type \'%s\' for \'%s\'';
var PROPERTY_MISMATCH = 'Property mismatch between \'%s\' & \'%s\' for \'%s\'';

var MISSING_OPTIONS = 'Missing arguments \'%s\'';
var INVALID_ARGUMENT = 'Unknown argument \'%s\' for \'%s\'';
var INVALID_OPTION = 'Unknown option \'%s\'';
var INVALID_CONDENSED_OPTION = 'Unknown option \'%s\' in \'%s\'';
var MISSING_VALUE = 'Missing \'%s\' for argument \'%s\'';
var INVALID_VALUE = 'Expecting \'%s\' for argument \'%s\'';

var OPTION_TERMINATOR = '--';

var DEFAULT_CONFIG = {
  help: {
    name: process.argv[0],
    noColor: false,
    usage: {
      requiredThreshold: 5,
      optionalThreshold: 4
    }
  },
  options: {
    help: {
      description: 'This help text'
    },
    version: {
      description: 'Show version info'
    }
  },
  operands: {
  }
};

function createShortId(id, shortIds) {
  var firstChar = id[0];
  if (!shortIds[firstChar]) {
    return firstChar;
  }
  return firstChar.toUpperCase();
}

function createLongId(id) {
  return paramCase(id);
}

function prepareShortId(option, shortIds) {
  /* jshint eqnull: true */
  if (option.shortId == null) {
    option.shortId = createShortId(option.id, shortIds);
  }
  var existing = shortIds[option.shortId];
  if (existing != null) {
    throw new Error(format(ID_CONFLICT, existing.id, option.id));
  }
  shortIds[option.shortId] = option;
}

function prepareLongId(option, longIds) {
  /* jshint eqnull: true */
  if (option.longId == null) {
    option.longId = createLongId(option.id);
  }
  var existing = longIds[option.longId];
  if (existing != null) {
    throw new Error(format(ID_CONFLICT, existing.id, option.id));
  }
  longIds[option.longId] = option;
}

function prepareType(option) {
  /* jshint eqnull: true */
  if (option.type == null && (option.value != null)) {
    option.type = typeof option.value;
  }
  if (option.type && !option.hint) {
    option.hint = option.type.toUpperCase();
  }
  if (option.type && (ARGUMENT_TYPES.indexOf(option.type) === -1)) {
    throw new Error(format(INVALID_TYPE, option.type, option.id));
  }
}

function prepareValue(option, values) {
  /* jshint eqnull: true */
  if (option.required || (option.value != null)) {
    values[option.id] = option.value;
  }
  if (option.required && (option.value != null))  {
    throw new Error(format(PROPERTY_MISMATCH, 'required', 'value', option.id));
  }
  if (option.value != null && (typeof option.value !== option.type)) {
    throw new Error(format(PROPERTY_MISMATCH, 'value', 'type', option.id));
  }
}

function prepareArgument(option, values) {
  prepareType(option);
  prepareValue(option, values);
}

function validateProperties(option, properties) {
  Object.keys(option).forEach(function (property) {
    if (properties.indexOf(property) === -1) {
      throw new Error(format(INVALID_PROPERTY, property, option.id));
    }
  });
}

function prepareOption(parser, id, option) {
  option.id = id;
  validateProperties(option, OPTION_PROPERTIES);
  prepareArgument(option, parser.optionValues);
  prepareShortId(option, parser.optionShortIds);
  prepareLongId(option, parser.optionLongIds);
}

function prepareOptions(parser, options) {
  Object.keys(options).forEach(function (id) {
    prepareOption(parser, id, options[id]);
  });
}

function prepareOperand(parser, id, operand) {
  operand.id = id;
  validateProperties(operand, OPERAND_PROPERTIES);
  prepareArgument(operand, parser.operandValues);
}

function prepareOperands(parser, operands) {
  Object.keys(operands).forEach(function (id) {
    prepareOperand(parser, id, operands[id]);
  });
}

function prepareArgv(argv) {
  if (argv) {
    return argv;
  }

  argv = process.argv;
  for (var i = 0; i < argv.length; i++) {
    var arg = argv[i];
    if (arg=== module.parent.filename || (arg === OPTION_TERMINATOR)) {
      argv = argv.slice(i + 1);
      break;
    }
  }
  return argv;
}

function invalidArgument(type, arg) {
  return arg === undefined || (type !== 'number' && (arg.indexOf('-') === 0));
}

function parseSingleArgument(option, arg) {
  if (invalidArgument(option.type, arg)) {
    throw new Error(format(MISSING_VALUE, option.hint, option.shortId));
  }
  if (option.type === 'number') {
    arg = +arg;
    if (isNaN(arg)) {
      throw new Error(format(INVALID_VALUE, option.hint, option.id));
    }
  } else if (option.type === 'boolean') {
    arg = arg.toLowerCase() === 'true';
  }
  return arg;
}

function parseMultipleArguments(option, args, argv) {
  var arg;
  while ((arg = argv.shift())) {
    try {
      args.push(parseSingleArgument(option, arg));
    } catch (error) {
      argv.unshift(arg);
      break;
    }
  }
  return args;
}

function parseArgument(option, argv, result) {
  var arg = parseSingleArgument(option, argv.shift());
  if (option.multiple) {
    arg = arg.split(',');
    var values = result.options[option.id];
    if (values) {
      arg = values.concat(arg);
    }
    arg = parseMultipleArguments(option, arg, argv);
  }
  return arg;
}

function parseOption(option, argv, result) {
  if (!option) {
    throw new Error(format(INVALID_ARGUMENT, option, option.shortId));
  }
  if (option.type) {
    return parseArgument(option, argv, result);
  }
  return true;
}

function parseOptions(args, shortIds, argv, result) {
  for (var i = 1; i < args.length; i++) {
    var arg = args[i];
    var option = shortIds[arg];
    if (!option) {
      throw new Error(format(INVALID_CONDENSED_OPTION, arg, args));
    }
    result.options[option.id] = parseOption(option, argv, result);
  }
}

function parseLongOption(parser, token, argv, result) {
  if (token.length > 2) {
    var option = parser.optionLongIds[token.substring(2)];
    if (!option) {
      throw new Error(format(INVALID_OPTION, token[1]));
    }
    result.options[option.id] = parseOption(option, argv, result);
  }
}

function parseShortOption(parser, token, argv, result) {
  if (token.length > 2) {
      parseOptions(token, parser.optionShortIds, argv, result);
  } else {
    var option = parser.optionShortIds[token[1]];
    if (!option) {
      throw new Error(format(INVALID_OPTION, token[1]));
    }
    result.options[option.id] = parseOption(option, argv, result);
  }
}

function parseToken(parser, token, argv, result) {
  if (parser.operandMode) {
    result.operands.push(token);
  } else if (token.indexOf('--') === 0) {
    if (token.length === 2) {
      parser.operandMode = true;
    } else {
      parseLongOption(parser, token, argv, result);
    }
  } else if (token.indexOf('-') === 0) {
    parseShortOption(parser, token, argv, result);
  } else {
    result.operands.push(token);
  }
}

// TODO add operand support
function checkResult(parser, result) {
  var missing = [];
  Object.keys(result.options).forEach(function (id) {
    if (result.options[id] === undefined) {
      missing.push(parser.options[id].longId);
    }
  });
  if (missing.length) {
    throw new Error(format(MISSING_OPTIONS, missing));
  }
}

function ArgvParser(config) {
  this.config = merge(DEFAULT_CONFIG, config);

  this.options = this.config.options;
  this.optionLongIds = {};
  this.optionShortIds = {};
  this.optionValues = {};

  prepareOptions(this, this.options);

  this.operands = this.config.operands;
  this.operandMode = false;
  this.operandValues = {};

  prepareOperands(this, this.operands);
}

ArgvParser.DEFAULT_CONFIG = DEFAULT_CONFIG;

ArgvParser.prototype.help = function (stream) {
  help(this.config.help, this.options, this.operands, stream);
};

ArgvParser.prototype.version = function (stream) {
  stream.write(this.version);
};

ArgvParser.prototype.parse = function (argv) {
  argv = prepareArgv(argv);

  var result = {
    options: clone(this.optionValues),
    operands: []//clone(this.operandValues)
  };

  for (var arg; (arg = argv.shift());) {
    parseToken(this, arg, argv, result);
  }

  if (result.help) {
    return this.help();
  }
  if (result.version) {
    return this.version();
  }

  checkResult(this, result);

  return result;
};

module.exports = ArgvParser;

