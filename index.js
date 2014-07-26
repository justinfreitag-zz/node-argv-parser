'use strict';

/* jshint eqnull: true */

var clone = require('node-v8-clone').clone;
var help = require('./lib/help');
var merge = require('merge');
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

var MISSING_ARGUMENTS = 'Missing arguments \'%s\'';
var INVALID_ARGUMENT = 'Unknown argument \'%s\' for \'%s\'';
var MISSING_VALUE = 'Missing \'%s\' for argument \'%s\'';
var INVALID_VALUE = 'Expecting \'%s\' for argument \'%s\'';

var OPTION_TERMINATOR = '--';

var DEFAULT_OPTIONS = {
  help: {
    description: 'This help text'
  },
  version: {
    description: 'Show utility version information'
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

function prepareOption(option, refs) {
  Object.keys(option).forEach(function (property) {
    if (OPTION_PROPERTIES.indexOf(property) === -1) {
      throw new Error(format(INVALID_PROPERTY, property, option.id));
    }
  });

  prepareShortId(option, refs.shortIds);
  prepareLongId(option, refs.longIds);
  prepareType(option);
  prepareValue(option, refs.values);
}

function prepareOptions(options, refs) {
  options = merge(DEFAULT_OPTIONS, options || {});

  Object.keys(options).forEach(function (id) {
    var option = options[id];

    option.id = id; // map camelCase ID

    prepareOption(option, refs);
  });

  return options;
}

function prepareOperand(operand, refs) {
  Object.keys(operand).forEach(function (property) {
    if (OPERAND_PROPERTIES.indexOf(property) === -1) {
      throw new Error(format(INVALID_PROPERTY, property, operand.id));
    }
  });

  prepareType(operand);
  prepareValue(operand, refs.values);
}

function prepareOperands(operands, refs) {
  Object.keys(operands).forEach(function (id) {
    var operand = operands[id];

    operand.id = id; // map camelCase ID

    prepareOperand(operand, refs);
  });

  return operands;
}

function prepareArgv(argv) {
  if (!argv) {
    argv = process.argv;
  }
  for (var i = 0; i < argv.length; i++) {
    if (argv[i] === module.parent.filename || (argv[i] === OPTION_TERMINATOR)) {
      argv = argv.slice(i + 1);
      break;
    }
  }
  return argv;
}

function checkResult(parser, result) {
  var missing = [];
  Object.keys(result).forEach(function (id) {
    if (result[id] === undefined) {
      missing.push(parser.options[id].longId);
    }
  });
  if (missing.length) {
    throw new Error(format(MISSING_ARGUMENTS, missing));
  }
}

function parseSingleArg(option, arg, fail) {
  if (arg === undefined || (arg.indexOf('-') === 0)) {
    if (fail) {
      throw new Error(format(MISSING_VALUE, option.hint, option.shortId));
    }
    return;
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

function parseMultipleArg(option, arg, argv) {
  var args = [arg];
  while ((arg = argv.shift())) {
    var value = parseSingleArg(option, arg, false);
    if (value !== undefined) {
      args.push(value);
    } else {
      argv.unshift(arg);
      break;
    }
  }
  return args;
}

function parseArg(option, arg, argv) {
  arg = parseSingleArg(option, argv.shift(), true);
  if (option.multiple) {
    arg = parseMultipleArg(option, arg, argv);
  }
  return arg;
}


function parseToken(token, argv, result, refs) {
  if (token.indexOf('--') === 0) {
    if (token.length > 2) {
      parseOption(refs.longIds[token.substring(2)], argv, result);
    }
  } else if (token.indexOf('-') === 0) {
    var option = refs.shortIds[token[1]];
    if (token.length > 2) {
      parseOptions(token, refs.shortIds, argv, result);
    } else {
      parseOption(option, argv, result);
    }
  } else {
    result.operands.push(token);
  }
}

function parseOption(option, argv, result) {
  if (!option) {
    throw new Error(format(INVALID_ARGUMENT, option, option.shortId));
  }

  var arg = true;
  if (option.type) {
    arg = parseArg(option, arg, argv);
  }
  result.options[option.id] = arg;
}

function parseOptions(args, shortIds, argv, result) {
  for (var i = 1; i < args.length; i++) {
    var option = shortIds[args[i]];
    parseOption(option, argv, result);
  }
}

function ArgvParser(config) {
  this.optionRefs = {
    longIds: {},
    shortIds: {},
    values: {}
  };
  this.options = prepareOptions(config.options, this.optionRefs);

  this.operandRefs = {
    values: {}
  };
  this.operands = prepareOperands(config.operands, this.operandRefs);
}

ArgvParser.prototype.help = function (stream) {
  help(this, stream);
};

ArgvParser.prototype.version = function (stream) {
  stream.write(this.version);
};

ArgvParser.prototype.parse = function (argv) {
  argv = prepareArgv(argv);

  var optionRefs = this.optionRefs;
  var operandRefs = this.operandRefs;
  var result = {
    options: clone(optionRefs.values),
    operands: []//clone(operandRefs.values)
  };

  var arg;
  // TODO add support for operands
  while ((arg = argv.shift())) {
    parseToken(arg, argv, result, optionRefs);
  }
  if (result.help) {
    this.help();
  }
  if (result.version) {
    this.version();
  }

  //checkResult(this, result);

  return result;
};

module.exports = ArgvParser;

