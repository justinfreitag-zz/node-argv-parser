'use strict';

var REQUIRED_COLOR = '\x1B[34m';

function colorText(string, color) {
  return color + string + '\x1B[39m';
}

function fill(property, maxLength) {
  return property + new Array(1 + maxLength - property.length).join(' ');
}

function createCondensedUsageStrings(options) {

}

function separateOptions(options) {
  var separatedOptions = {
    requiredCondensed: '',
    requiredArgument: [],
    optionalCondensed: '',
    optionalArgument: []
  };

  Object.keys(options).sort().forEach(function (id) {
    var option = options[id];
    if (option.required) {
      if (option.type) {
        separatedOptions.requiredArgument.push(option.shortId);
      } else {
        separatedOptions.requiredCondensed += option.shortId;
      }
    } else {
      if (option.type) {
        separatedOptions.optionalArgument.push(option.shortId);
      } else {
        separatedOptions.optionalCondensed += option.shortId;
      }
    }
  });

  return separatedOptions;
}

function createUsageString(parser, options) {
  var name = parser.config.name || process.argv[0];
  var usage = ' Usage: ' + name + ' ';

  var totalRequired =
    options.requiredCondensed.length +
    options.requiredArgument.length;

  var requiredString = '';
  if (totalRequired < 5) {
    if (options.requiredCondensed.length) {
      requiredString = '-' + options.requiredCondensed + ' ';
    }
    options.requiredArgument.forEach(function (id) {
      var option = parser.optionShortIds[id];
      requiredString += '-' + option.shortId + ' ' + option.hint;
      if (option.multiple) {
        requiredString += '...';
      }
      requiredString += ' ';
    });
  } else {
    requiredString = 'options ';
  }
  usage += colorText(requiredString, REQUIRED_COLOR);

  var totalOptional =
    options.optionalCondensed.length +
    options.optionalArgument.length;

  if (totalOptional < 4) {
    if (options.optionalCondensed.length) {
      usage += '[-' + options.optionalCondensed + '] ';
    }
    options.optionalArgument.sort().forEach(function (id) {
      var option = parser.optionShortIds[id];
      usage += '[-' + option.shortId + ' ' + option.hint;
      if (option.multiple) {
        usage += '...';
      }
      usage += '] ';
    });
  } else {
    usage += '[options]';
  }

  return usage;
}

function createLongForm(option) {
  var longForm = '--' + option.longId;

  if (option.type) {
    longForm += ' ' + option.hint;
    if (option.value) {
      longForm += ':' + option.value;
    }
    if (option.multiple) {
      longForm += '...';
    }
  }

  return longForm;
}

function calcLongFormWidth(longForms) {
  return Object.keys(longForms).reduce(function (width, id) {
    var longForm = longForms[id];
    return longForm.length > width ? longForm.length : width;
  }, 0);
}

function createOptionsString(options) {
  var longForms = {};
  Object.keys(options).sort().forEach(function (id) {
    longForms[id] = createLongForm(options[id]);
  });

  var longFormWidth = calcLongFormWidth(longForms);
  var optionString = ' Options:\n\n';

  Object.keys(longForms).forEach(function (id) {
    var option = options[id];
    var longFormString = '  -' + option.shortId + ', ' +
      fill(longForms[id], longFormWidth) + '  ';
    if (option.required) {
      longFormString = colorText(longFormString, REQUIRED_COLOR);
    }
    optionString += longFormString;
    optionString += option.description + '\n';
  });

  return optionString;
}

function createBannerString(parser) {
  var bannerString = '';

  if (parser.banner) {
    bannerString = parser.banner + '\n';
  }

  return bannerString;
}

module.exports = function (parser, stream) {
  var out = '';

  out += createBannerString(parser);
  out += '\n';
  out += createUsageString(parser, separateOptions(parser.options));
  out += '\n\n';
  out += createOptionsString(parser.options);

  // TODO add operand support

  stream.write(out + '\n');
};

