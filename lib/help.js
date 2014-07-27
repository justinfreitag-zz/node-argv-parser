'use strict';

var REQUIRED_COLOR = '\x1B[34m';

function colorString(config, string, color) {
  if (config.noColor) {
    return string;
  }
  return color + string + '\x1B[39m';
}

function fillWidth(string, width) {
  return string + new Array(1 + width - string.length).join(' ');
}

function separateOptions(options, required) {
  var separatedOptions = {
    flags: '',
    arguments: []
  };

  Object.keys(options).sort().forEach(function (id) {
    var option = options[id];

    if ((option.required || false) === required) {
      if (option.type) {
        separatedOptions.arguments.push(option);
      } else {
        separatedOptions.flags += option.shortId;
      }
    }
  });

  return separatedOptions;
}

function createRequiredOptionsUsageString(config, options) {
  var string = '';
  var totalRequired = options.flags.length + options.arguments.length;

  if (totalRequired < config.usage.requiredThreshold) {
    if (options.length) {
      string += '-' + options.flags + ' ';
    }
    options.arguments.forEach(function (option) {
      string += '-' + option.shortId + ' ' + option.hint;
      if (option.multiple) {
        string += '...';
      }
      string += ' ';
    });
  } else {
    string = 'options ';
  }

  return colorString(config, string, REQUIRED_COLOR);
}

function createOptionalOptionsUsageString(config, options) {
  var string = '';
  var totalOptional = options.flags.length + options.arguments.length;

  if (totalOptional < config.usage.optionalThreshold) {
    if (options.flags.length) {
      string += '[-' + options.flags + '] ';
    }
    options.arguments.forEach(function (option) {
      string += '[-' + option.shortId + ' ' + option.hint;
      if (option.multiple) {
        string += '...';
      }
      string += '] ';
    });
  } else {
    string += '[options] ';
  }

  return string;
}

function createUsageString(config, requiredOptions, optionalOptions) {
  var string = ' Usage: ' + config.name + ' ';

  string += createRequiredOptionsUsageString(config, requiredOptions);
  string += createOptionalOptionsUsageString(config, optionalOptions);

  return string;
}

function createLongString(option) {
  var longString = '--' + option.longId;

  if (option.type) {
    longString += ' ' + option.hint;
    if (option.value) {
      longString += ':' + option.value;
    }
    if (option.multiple) {
      longString += '...';
    }
  }

  return longString;
}

function calcLongStringWidth(longStrings) {
  return Object.keys(longStrings).reduce(function (width, id) {
    var longString = longStrings[id];
    return longString.length > width ? longString.length : width;
  }, 0);
}

function createOptionsString(config, options) {
  var longStrings = {};
  Object.keys(options).sort().forEach(function (id) {
    longStrings[id] = createLongString(options[id]);
  });

  var longStringWidth = calcLongStringWidth(longStrings);
  var optionString = ' Options:\n\n';

  Object.keys(longStrings).forEach(function (id) {
    var option = options[id];
    var longStringString = '  -' + option.shortId + ', ' +
      fillWidth(longStrings[id], longStringWidth) + '  ';
    if (option.required) {
      longStringString = colorString(config, longStringString, REQUIRED_COLOR);
    }
    optionString += longStringString;
    optionString += option.description + '\n';
  });

  return optionString;
}

function createBannerString(config) {
  if (config.banner) {
    return config.banner + '\n';
  }

  return '';
}

module.exports = function (config, options, operands, stream) {
  var helpString = '';
  var requiredOptions = separateOptions(options, true);
  var optionalOptions = separateOptions(options, false);

  helpString += createBannerString(config);
  helpString += '\n';
  helpString += createUsageString(config, requiredOptions, optionalOptions);
  helpString += '\n\n';
  helpString += createOptionsString(config, options);

  // TODO add operand support

  stream.write(helpString + '\n');
};

