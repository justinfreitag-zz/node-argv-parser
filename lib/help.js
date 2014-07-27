'use strict';

var REQUIRED_COLOR = '\x1B[34m';

function colorString(string, color) {
  return color + string + '\x1B[39m';
}

function fillWidth(string, width) {
  return string + new Array(1 + width - string.length).join(' ');
}

function wrapOptionalOnly(string, required) {
  if (!required) {
    return '[' + string + ']';
  }
  return string;
}

function highlightRequiredOnly(string, required, noColor) {
  if (required && !noColor) {
    return colorString(string, REQUIRED_COLOR);
  }
  return string;
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

function createOptionsUsageString(options, required, threshold, noColor) {
  var string = '';
  var total = options.flags.length + options.arguments.length;

  if (total < threshold) {
    if (options.flags.length) {
      string += wrapOptionalOnly('-' + options.flags, required) + ' ';
    }
    options.arguments.forEach(function (option) {
      var argumentString = '-' + option.shortId + ' ' + option.hint;
      if (option.multiple) {
        argumentString += '...';
      }
      string += wrapOptionalOnly(argumentString, required) + ' ';
    });
  } else {
    string += wrapOptionalOnly('options', required) + ' ';
  }

  return highlightRequiredOnly(string, required, noColor);
}

function createOperandsUsageString(operands, threshold, noColor) {
  var string = '';
  Object.keys(operands).forEach(function (id) {
    var option = operands[id];
    var argumentString = option.hint;
    if (option.multiple) {
      argumentString += '...';
    }
    argumentString = wrapOptionalOnly(argumentString, option.required) + ' ';
    string += highlightRequiredOnly(argumentString, option.required, noColor);
  });
  return string;
}

function createUsageString(requiredOptions, optionalOptions, operands, config) {
  var string = ' Usage: ' + config.name + ' ';

  string += createOptionsUsageString(
    requiredOptions, true, config.usage.requiredThreshold, config.noColor
  );
  string += createOptionsUsageString(
    optionalOptions, false, config.usage.optionalThreshold, config.noColor
  );

  string += createOperandsUsageString(operands, 5, config.noColor);

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

function createOperandString(option) {
  var operandString = '';

  operandString += ' ' + option.hint;
  if (option.value) {
    operandString += ':' + option.value;
  }
  if (option.multiple) {
    operandString += '...';
  }

  return operandString;
}

function calcLongStringWidth(longStrings) {
  return Object.keys(longStrings).reduce(function (width, id) {
    var longString = longStrings[id];

    return longString.length > width ? longString.length : width;
  }, 0);
}

function createOptionsString(options, longStrings, width, config) {
  var optionString = ' Options:\n\n';

  Object.keys(longStrings).forEach(function (id) {
    var option = options[id];
    var longString = '  -' + option.shortId + ', ' +
      fillWidth(longStrings[id], width) + '  ';

    if (option.required) {
      longString = colorString(longString, REQUIRED_COLOR, config.noColor);
    }

    optionString += longString;
    optionString += option.description + '\n';
  });

  return optionString;
}

function createOperandsString(operands, operandStrings, width, config) {
  var operandsString = ' Operands:\n\n';

  Object.keys(operandStrings).forEach(function (id) {
    var option = operands[id];
    var longString = ' ' + fillWidth(operandStrings[id], width + 5) + '  ';
    if (option.required) {
      longString = colorString(longString, REQUIRED_COLOR, config.noColor);
    }
    operandsString += longString;
    operandsString += option.description + '\n';
  });

  return operandsString;
}

function createBannerString(config) {
  if (config.banner) {
    return ' ' + config.banner + '\n';
  }

  return '';
}

module.exports = function (config, options, operands, stream) {
  var helpString = '';
  var requiredOptions = separateOptions(options, true);
  var optionalOptions = separateOptions(options, false);

  helpString += createBannerString(config);
  helpString += '\n';
  helpString += createUsageString(
    requiredOptions,
    optionalOptions,
    operands,
    config
  );
  helpString += '\n\n';

  var optionLongStrings = {};
  Object.keys(options).sort().forEach(function (id) {
    optionLongStrings[id] = createLongString(options[id]);
  });
  var optionLongStringWidth = calcLongStringWidth(optionLongStrings);
  var operandStrings = {};
  Object.keys(operands).forEach(function (id) {
    operandStrings[id] = createOperandString(operands[id]);
  });
  var operandStringWidth = calcLongStringWidth(operandStrings);
  var width = optionLongStringWidth > operandStringWidth ?
    optionLongStringWidth :
    operandStringWidth;

  helpString += createOptionsString(options, optionLongStrings, width, config);

  helpString += '\n';
  helpString += createOperandsString(operands, operandStrings, width, config);

  stream.write(helpString + '\n');
};

