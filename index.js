'use strict';

var help = require('./lib/help');
var merge = require('deepmerge');
var paramCase = require('param-case');
var format = require('util').format;

var META_PROPERTIES = [
  'description',
  'required',
  'type',
  'name',
  'default',
  'many',
  'parse',
  'validate'
];

var ARGUMENT_TYPES = [
  'string',
  'boolean',
  'number'
];

var OPTION_PROPERTIES = [
  'id',
  'longId',
  'shortId'
].concat(META_PROPERTIES);

var OPERAND_PROPERTIES = [
  'id'
].concat(META_PROPERTIES);

var ID_CONFLICT = 'ID conflict between between \'%s\' and \'%s\'';
var INVALID_TYPE = 'Invalid type \'%s\' for \'%s\'';
var INVALID_PROPERTY = 'Unknown property \'%s\' for \'%s\'';
var PROPERTY_MISMATCH = 'Property mismatch between \'%s\' & \'%s\' for \'%s\'';
var MISSING_ARGUMENT = 'Missing argument \'%s\'';
var INVALID_OPTION = 'Unknown option \'%s\'';
var INVALID_VALUE = 'Expecting \'%s\' for argument \'%s\'';
var INVALID_OPERAND = 'Unknown operand \'%s\'';

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

function createShortId(id, optionCache) {
  var firstChar = id[0];

  if (optionCache[firstChar]) {
    return firstChar.toUpperCase();
  }

  return firstChar;
}

function createLongId(id) {
  return paramCase(id);
}

function prepareType(meta) {
  /* jshint eqnull: true */

  if (meta.type == null && (meta.default != null)) {
    meta.type = typeof meta.default;
  }

  if (meta.type && !meta.name) {
    meta.name = meta.type.toUpperCase();
  }

  if (meta.type && (ARGUMENT_TYPES.indexOf(meta.type) === -1)) {
    throw new Error(format(INVALID_TYPE, meta.type, meta.id));
  }
}

function prepareArgument(meta) {
  prepareType(meta);

  /* jshint eqnull: true */

  if (meta.required && (meta.default != null))  {
    throw new Error(format(PROPERTY_MISMATCH, 'required', 'default', meta.id));
  }

  if (meta.default != null && (typeof meta.default !== meta.type)) {
    throw new Error(format(PROPERTY_MISMATCH, 'default', 'type', meta.id));
  }
}

function validateProperties(meta, properties) {
  Object.keys(meta).forEach(function (property) {
    if (properties.indexOf(property) === -1) {
      throw new Error(format(INVALID_PROPERTY, property, meta.id));
    }
  });
}

function prepareOption(option, id, optionCache) {
  prepareMeta(option, id, OPTION_PROPERTIES);

  /* jshint eqnull: true */

  if (option.shortId == null) {
    option.shortId = createShortId(option.id, optionCache);
  }

  if (option.longId == null) {
    option.longId = createLongId(option.id);
  }
}

function prepareMeta(meta, id, properties) {
  meta.id = id;

  validateProperties(meta, properties);

  prepareArgument(meta);
}

function isOption(arg) {
  return arg.indexOf('-') === 0;
}

function isLongOption(arg) {
  return arg.indexOf('--') === 0;
}

function isEscaped(arg) {
  return arg[0] === '"' && (arg[arg.length - 1] === '"');
}

function parseArg(meta, arg) {
  if (meta.parse) {
    return meta.parse(meta, arg);
  }

  if (meta.type === 'number') {
    arg = +arg;

    if (isNaN(arg)) {
      throw new Error(format(INVALID_VALUE, meta.name, meta.id));
    }
  }

  return arg;
}

function validateResult(meta, arg) {
  if (meta.validate) {
    return meta.validate(arg);
  }

  return true;
}

function tokeniseArg(arg, args) {
  if (isEscaped(arg)) {
    return arg.substring(1, arg.length - 1);
  }

  arg = arg.split(','); // doesn't support escaping
  arg.reverse().forEach(function (arg) {
    args.push(arg);
  });

  return args.pop();
}

function tokeniseLongOption(arg, args, optionCache) {
  var i = arg.indexOf('=');

  if (i !== -1) {
    args.push(arg.substring(i + 1));
    arg = arg.substring(2, i);
  }

  var option = optionCache[arg];

  if (!option) {
    throw new Error(format(INVALID_OPTION(arg)));
  }

  return option.shortId;
}

function tokeniseShortOption(arg, args, optionCache) {
  var tokens = [];

  for (var i = 1; i < arg.length; i++) {
    var option = optionCache[arg[i]];

    if (!option) {
      throw new Error(format(INVALID_OPTION(arg)));
    }

    tokens.push('-' + arg[i]);

    if (option.type) {
      i += arg[i + 1] === '=';
      tokens.push(arg.substring(arg[i + 1]));
    }
  }

  tokens.reverse().forEach(function (token) {
    args.push(token);
  });

  return args.pop()[1];
}

function tokeniseOption(arg, args, optionCache) {
  if (isLongOption(arg)) {
    return tokeniseLongOption(arg, args, optionCache);
  }

  return tokeniseShortOption(arg, args, optionCache);
}

function setResult(meta, result, results) {
  if (results[meta.id]) {
    throw new Error(format(INVALID_VALUE, meta.id));
  }

  results[meta.id] = result;
}

function addResult(meta, result, results) {
  var existingResult = results[meta.id] || null;

  if (meta.type) {
    if (existingResult) {
      existingResult.push(result);
    } else {
      results[meta.id] = [result];
    }

    return;
  }

  results[meta.id] += result;
}

function handleArg(meta, arg, args, results) {
  var result = parseArg(meta, tokeniseArg(arg, args));

  validateResult(meta, result);

  handleResult(meta, result, results);
}

function handleResult(meta, result, results) {
  if (meta.many) {
    addResult(meta, result, results);
  } else {
    setResult(meta, result, results);
  }
}

function handleOption(arg, args, optionCache, results)  {
  var option = optionCache[tokeniseOption(arg, args, optionCache)];

  if (option.type) {
    return option;
  }

  handleResult(option, true, results);
}

function handleOperand(operand, arg, operandStack, results) {
  if (!operand) {
    throw new Error(INVALID_OPERAND(format(arg)));
  }

  handleArg(operand, arg, results);

  if (operand.many) {
    return operand;
  }

  return operandStack.pop();
}

function parse(args, optionCache, operandStack) {
  /* jshint maxstatements: 16 */

  var results = {};
  var arg;

  while ((arg = args.pop())) {
    var option;
    var operand;

    if (operand) {
      operand = handleOperand(operand, arg, operandStack, results);
      continue;
    }

    if (arg === OPTION_TERMINATOR) {
      operand = operandStack.pop();
      continue;
    }

    if (isOption(arg)) {
      option = handleOption(arg, args, optionCache, results);
      continue;
    }

    handleArg(option, arg, results);
  }

  return results;
}

function createOptionCache(options) {
  var optionCache = {};

  Object.keys(options).forEach(function (id) {
    var option = options[id];

    prepareOption(option, id, optionCache);

    var existing = optionCache[option.shortId] || optionCache[option.longId];
    if (existing) {
      throw new Error(format(ID_CONFLICT, existing.id, option.id));
    }

    optionCache[option.longId] = optionCache[option.shortId] = option;
  });

  return optionCache;
}

function createOperandStack(operands) {
  return Object.keys(operands).reverse().map(function (id) {
    return prepareMeta(operands[id], id, OPERAND_PROPERTIES);
  });
}

function applyDefaults(results, metas) {
  Object.keys(metas).forEach(function (id) {
    var meta = metas[id];

    if (meta.default && results[id] === undefined) {
      results[id] = meta.default;
    }
  });
}

function validateResults(results, config) {
  [config.options, config.operands].forEach(function (metas) {
    Object.keys(metas).forEach(function (id) {
      var meta = metas[id];
      if (meta.required && (results[id] === undefined)) {
        throw new Error(format(MISSING_ARGUMENT, meta.longId || meta.name));
      }
    });
  });
}

exports.help = function (config) {
  exports.parse(['-h'], config);
};

exports.parse = function (argv, config) {
  config = merge(DEFAULT_CONFIG, config);

  var args = (argv || process.argv).slice().reverse();
  var optionCache = createOptionCache(config.options);
  var operandStack = createOperandStack(config.operands);

  var results = parse(args, optionCache, operandStack);

  if (results.help) {
    help(config.help, config.options, config.operands, process.stdout);
    return;
  }

  if (results.version) {
    process.stdout.write(config.version + '\n');
    return;
  }

  applyDefaults(results, config.options);
  applyDefaults(results, config.operands);

  validateResults(results, config);

  return results;
};

