'use strict';

function fill(string, width) {
  return string + new Array(1 + width - string.length).join(' ');
}

function wrapOptional(string, required) {
  if (required) {
    return string;
  }

  return '[' + string + ']';
}

function filterRequired(options, required) {
  var separatedOptions = {
    flags: '',
    args: []
  };

  Object.keys(options).sort().forEach(function (id) {
    var option = options[id];

    if ((option.required || false) === required) {
      if (option.type) {
        separatedOptions.args.push(option);
      } else {
        separatedOptions.flags += option.shortId;
      }
    }
  });

  return separatedOptions;
}

function createOptionsUsage(options, required, threshold) {
  var total = options.flags.length + options.args.length;

  if (total >= threshold) {
    return wrapOptional('options', required) + ' ';
  }

  var usage = '';

  if (options.flags.length) {
    usage += wrapOptional('-' + options.flags, required) + ' ';
  }

  options.args.forEach(function (option) {
    var signature = '-' + option.shortId + ' ' + option.name;

    if (option.many) {
      signature += '...';
    }

    usage += wrapOptional(signature, required) + ' ';
  });

  return usage;
}

function createOperandsUsage(operands) {
  var usage = '';

  Object.keys(operands).forEach(function (id) {
    var operand = operands[id];
    var signature = operand.name;

    if (operand.many) {
      signature += '...';
    }

    usage += wrapOptional(signature, operand.required) + ' ';
  });

  return usage;
}

function createUsage(options, operands, config) {
  var usage = ' Usage: ' + config.name + ' ';

  usage += createOptionsUsage(
    filterRequired(options, true), true, config.requiredThreshold
  );

  usage += createOptionsUsage(
    filterRequired(options, false), false, config.optionalThreshold
  );

  usage += createOperandsUsage(operands);

  return usage;
}

function createOptionSignature(option) {
  var signature = '-' + option.shortId + ', --' + option.longId;

  if (option.type) {
    signature += ' ' + option.name;

    if (option.default) {
      signature += ':' + option.default;
    }

    if (option.many) {
      signature += '...';
    }
  }

  return signature;
}

function createOperandSignature(option) {
  var signature = option.name;

  if (option.default) {
    signature += ':' + option.default;
  }

  if (option.many) {
    signature += '...';
  }

  return signature;
}

function calculateMaxWidth(object) {
  return Object.keys(object).reduce(function (a, property) {
    var b = object[property].signature.length;

    return b > a ? b : a;
  }, 0);
}

function createSection(title, rows, width) {
  var section = ' ' + title + ':\n\n';

  Object.keys(rows).forEach(function (id) {
    section += '   ' + fill(rows[id].signature, width) + '   ';
    section += rows[id].description + '\n';
  });

  return section;
}

function createBanner(config) {
  if (config.banner) {
    return ' ' + config.name + ' - ' + config.banner + '\n';
  }

  return '';
}

function createHeader(config, options, operands) {
  var header = '';

  header += createBanner(config);
  header += '\n';
  header += createUsage(options, operands, config);
  header += '\n\n';

  return header;
}

function createBody(options, operands) {
  var optionRows = {};

  Object.keys(options).sort().forEach(function (id) {
    optionRows[id] = {
      signature: createOptionSignature(options[id]),
      description: options[id].description
    };
  });

  var operandRows = {};

  Object.keys(operands).forEach(function (id) {
    operandRows[id] = {
      signature: createOperandSignature(operands[id]),
      description: operands[id].description
    };
  });

  var maxOptionSignatureWidth = calculateMaxWidth(optionRows);
  var maxOperandSignatureWidth = calculateMaxWidth(operandRows);

  var width = maxOptionSignatureWidth > maxOperandSignatureWidth ?
    maxOptionSignatureWidth :
    maxOperandSignatureWidth;

  var body = '';
  body += createSection('Options', optionRows, width);
  body += '\n';
  body += createSection('Operands', operandRows, width);

  return body;
}

module.exports = function (config, options, operands) {
  var help = '';

  help += createHeader(config, options, operands);
  help += createBody(options, operands);

  return help;
};

