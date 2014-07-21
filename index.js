'use strict';

var clone = require('node-v8-clone').clone;
var merge = require('merge');
var paramCase = require('param-case');
var util = require('util');

var OPTION_PROPERTIES = [
  'id',
  'shortId',
  'longId',
  'description',
  'type',
  'placeholder',
  'required',
  'default'
];

var OPTION_TYPES = [
  'string',
  'boolean',
  'integer',
  'float',
  'number'
];

var MISSING_PROPERTIES = 'Missing properties for %s';
var SHORT_ID_CONFLICT = 'Short ID conflict between %s and %s';
var INVALID_PROPERTY = 'Invalid property in %s: %s';
var INVALID_TYPE = 'Invalid type for %s';
var DEFAULT_REQUIRED_MISMATCH = 'Default and required mismatch in %s';
var DEFAULT_TYPE_MISMATCH = 'Default and type mismatch in %s';

var MISSING_ARGUMENTS = 'Missing arguments: %s';
var INVALID_ARGUMENT = 'Unknown argument %s';
var MISSING_VALUE = 'Missing %s for argument %s';
var INVALID_VALUE = 'Expecting %s for argument %s';

var ARGUMENT_TERMINATOR = '--';

function getMaxLength(propertyId, options, withPlaceholder) {
  var maxLength = 0;
  Object.keys(options).forEach(function (id) {
    var option = options[id];
    var length = option[propertyId].length;
    if (withPlaceholder && (option.type !== 'boolean')) {
      length += option.placeholder.length + 3;
      if (option.default) {
        length += ('' + option.default).length;
        console.log('length', length);
      }
    }
    if (length > maxLength) {
      maxLength = length;
    }
  });
  return maxLength;
}

function fillProperty(property, maxLength) {
  return property + new Array(1 + maxLength - property.length).join(' ');
}

function displayHelp(parser) {
  var out = '';

  if (parser.banner) {
    out += parser.banner + '\n';
  }
  out += '\n';

  var options = parser.options;
  var usage = process.argv[0] + ' ';
  Object.keys(options)
    .sort(function (a, b) {
      return a > b;
    })
    .forEach(function (id) {
      var option = options[id];
      if (option.required) {
        usage += '\x1B[34m';
        usage += option.shortId + ' ' + (option.placeholder || '') + ' ';
        usage += '\x1B[39m';
      }
    });

  usage += '[options]';
  out += 'Usage: ' + usage + '\n\n';

  var shortIdLength = getMaxLength('shortId', options);
  var longIdLength = getMaxLength('longId', options, true);

  out += 'Options:\n\n';
  Object.keys(options)
    .sort(function (a, b) {
      return a > b;
    })
    .forEach(function (id) {
      var option = options[id];
      if (option.required) {
        out += '\x1B[34m';
      }
      out += '  ' + fillProperty(option.shortId, shortIdLength);
      var longId = option.longId;
      if (option.type !== 'boolean') {
        longId += ' ' + option.placeholder;
        //if (option.default) {
        //  longId += '\x1B[32m:' + option.default + '\x1B[39m';
        //}
      }
      out += '  ' + fillProperty(longId, longIdLength);
      if (option.description) {
        out += '    ' + option.description;
      }
      out += '\x1B[39m\n';
    });

  console.log(out);
}

function checkOptions(options) {
  var shortOptions = {};

  Object.keys(options).forEach(function (id) {
    var option = options[id];

    var shortOption = shortOptions[id];
    if (shortOption) {
      throw new Error(util.format(SHORT_ID_CONFLICT, shortOption.id, id));
    }
    shortOptions[option.shortId] = option;

    Object.keys(option).forEach(function (property) {
      if (OPTION_PROPERTIES.indexOf(property) === -1) {
        throw new Error(util.format(INVALID_PROPERTY, id, property));
      }
    });

    if (OPTION_TYPES.indexOf(option.type) === -1) {
      throw new Error(util.format(INVALID_TYPE, option.type, id));
    }

    if (option.default) {
      if (option.required) {
        throw new Error(util.format(DEFAULT_REQUIRED_MISMATCH, id));
      }
      if (typeof option.default !== option.type) {
        throw new Error(util.format(DEFAULT_TYPE_MISMATCH, id));
      }
    }
  });
}

function createShortId(id) {
  var shortId = id[0];
  for (var i = 1; i < id.length; i++) {
    var c = id[i];
    if ((c >= 'A') && (c <= 'Z')) {
      shortId += c;
    }
  }
  return '-' + shortId.toLowerCase();
}

function createLongId(id) {
  return '--' + paramCase(id);
}

function createDefaults(options) {
  var defaults = {};
  Object.keys(options).forEach(function (id) {
    var option = options[id];
    if (option.required || option.default !== undefined) {
      defaults[id] = option.default;
    }
  });
  return defaults;
}

function createLookup(options, propertyId) {
  var references = {};
  Object.keys(options).forEach(function (id) {
    var option = options[id];
    references[option[propertyId]] = option;
  });
  return references;
}

function prepareOptions(options) {
  Object.keys(options).forEach(function (id) {
    var option = options[id];

    if (!Object.keys(option).length) {
      throw new Error(util.format(MISSING_PROPERTIES, id));
    }

    option.id = id;

    if (!option.longId) {
      option.longId = createLongId(id);
    }

    if (option.shortId !== null) {
      option.shortId = createShortId(id);
    }

    /* jshint eqnull: true */
    if (!option.type && option.default != null) {
      option.type = typeof option.default;
    }

    if (!option.placeholder) {
      option.placeholder = option.type.toUpperCase();
    }
  });
}

function handleError(parser, error) {
  if (error) {
    console.log('\n\x1B[31mERROR: ' + error + '\x1B[39m');
  }
  displayHelp(parser);
  process.exit(!!error);
}

var DEFAULT_OPTIONS = {
  help: {
    description: 'This help text',
    required: false,
    default: false
  }
};

function ArgvParser(options) {
  this.options = merge(DEFAULT_OPTIONS, options);

  prepareOptions(this.options);
  checkOptions(this.options);

  this.longIds = createLookup(this.options, 'longId');
  this.shortIds = createLookup(this.options, 'shortId');

  this.defaults = createDefaults(this.options);
}

function prepareArguments(argv) {
  if (!argv) {
    argv = process.argv;
  }
  for (var i = 0; i < argv.length; i++) {
    if (
      argv[i] === module.parent.filename || (argv[i] === ARGUMENT_TERMINATOR)
    ) {
      argv = argv.slice(i + 1);
      break;
    }
  }
  return argv;
}

function checkValues(parser, values) {
  var missing = [];
  Object.keys(values).forEach(function (id) {
    if (values[id] === undefined) {
      missing.push(parser.options[id].longId);
    }
  });
  if (missing.length) {
    return handleError(parser, util.format(MISSING_ARGUMENTS, missing));
  }
}

function parseValue(parser, value, option) {
  if (value === undefined || (value.indexOf('-') === 0)) {
    return handleError(
      parser, util.format(MISSING_VALUE, option.type, option.shortId)
    );
  }
  if (option.type !== 'string') {
    value = +value;
  }
  if (isNaN(value)) {
    handleError(
      parser, util.format(INVALID_VALUE, option.placeholder, option.id)
    );
  }
  return value;
}

ArgvParser.prototype.parse = function (argv) {
  var values = clone(this.defaults);
  values.argv = argv = prepareArguments(argv);

  while (argv.length && !argv[0].indexOf('-')) {
    var id = argv.shift();
    var option = this.shortIds[id] || this.longIds[id];
    if (!option) {
      return handleError(this, util.format(INVALID_ARGUMENT, id));
    }
    if (option.type === 'boolean') {
      values[option.id] = true;
    } else {
      values[option.id] = parseValue(this, argv.shift(), option);
    }
    if (values.help) {
      return handleError(this);
    }
  }

  checkValues(this, values);

  return values;
};

module.exports = ArgvParser;

