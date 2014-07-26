'use strict';

function getMaxLength(propertyId, options, withPlaceholder) {
  var maxLength = 0;
  Object.keys(options).forEach(function (id) {
    var option = options[id];
    var length = option[propertyId].length;
    if (withPlaceholder && (option.type !== 'boolean')) {
      length += option.placeholder.length + 3;
      if (option.default) {
        length += ('' + option.default).length;
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

function createUsage(args) {
  var argumentIds = Object.keys(args);
  var argumentCount = argumentIds.length;
  var usage = '';

  if (argumentCount) {
    return usage;
  }

  usage += ' ';
  argumentIds
    .forEach(function (id) {
      var argument = argumentIds[id];
      if (argument.required) {
        --argumentCount;
        usage += '\x1B[34m';
        usage += argument.placeholder;
        if (argument.multiple) {
          usage += '...';
        }
        usage += '\x1B[39m ';
      }
    });

    if (argumentCount) {
      usage += '[';
      if (argumentCount > 2) {
        usage += 'args...';
      } else {
        // TODO loop through optional
        usage += '';
      }
      usage += ']';
    }

  return usage;
}

module.exports = function (parser) {
  var out = '';

  if (parser.banner) {
    out += parser.banner + '\n';
  }
  out += '\n';

  var options = parser.options;

  var usage = process.argv[0] + ' ' + createUsage(options);
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
        if (option.default) {
          longId += ':' + option.default;
        }
      }
      out += '  ' + fillProperty(longId, longIdLength);
      if (option.description) {
        out += '    ' + option.description;
      }
      out += '\x1B[39m\n';
    });

  console.log(out);
};

