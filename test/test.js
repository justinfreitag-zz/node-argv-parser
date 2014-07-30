'use strict';

var assert = require('assert');
var parser = require('..');

it('should hande short options', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string'
      },
    }
  };
  var result = parser.parse('-f -b bar'.split(' '), config);
  assert.equal(result.options.foo, true);
  assert.equal(result.options.bar, 'bar');
});

it('should hande long options', function() {
  var config = {
    options: {
      fooBar: {
        description: 'Test --fooBar'
      },
      barFoo: {
        description: 'Test --barFoo',
        type: 'string'
      },
    }
  };
  var result = parser.parse('--foo-bar --bar-foo bar'.split(' '), config);
  assert.equal(result.options.fooBar, true);
  assert.equal(result.options.barFoo, 'bar');
});

it('should fail when long option missing -- prefix', function() {
  var config = {
    options: {
      fooBar: {
        description: 'Test --fooBar'
      },
      barFoo: {
        description: 'Test --barFoo',
        type: 'string'
      },
    }
  };
  assert.throws(function () {
    console.log(parser.parse('-foo-bar --bar-foo bar'.split(' '), config));
  });
});

it('should fail when unknown option specified', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      }
    }
  };
  assert.throws(function () {
    parser.parse('-f -F'.split(' '), config);
  });
});

it('should fail when missing argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string'
      }
    }
  };
  assert.throws(function () {
    parser.parse('-f'.split(' '), config);
  });
});

it('should fail when invalid argument specified', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        type: 'number'
      }
    }
  };
  assert.throws(function () {
    parser.parse('-b boo'.split(' '), config);
  });
});

it('should handle signed number arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'number'
      }
    }
  };
  var result = parser.parse('-f -b -42'.split(' '), config);
  assert.equal(result.options.foo, true);
  assert.strictEqual(result.options.bar, -42);
});

it('should apply default when option missing', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'number',
        default: 42
      }
    }
  };
  var result = parser.parse('-f'.split(' '), config);
  assert.equal(result.options.foo, true);
  assert.strictEqual(result.options.bar, 42);
});

it('should fail on default/type mismatch', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        default: 42
      }
    }
  };
  assert.throws(function () {
    parser.parse('-b bar'.split(' '), config);
  });
});

it('should fail on required and default property mismatch', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        default: 'bar',
        required: true
      }
    }
  };
  assert.throws(function () {
    parser.parse('', config);
  });
});

it('should fail on unknown property', function() {
  var config = {
    options: {
      bar: {
        foo: 'Test --bar'
      }
    }
  };
  assert.throws(function () {
    parser.parse('', config);
  });
});

// TODO add suport for array values, implies many=true
it('should fail on unknown default value type', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        default: ['foo', 'bar']
      }
    }
  };
  assert.throws(function () {
    parser.parse('', config);
  });
});

it('should handle condensed short options', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string'
      },
    }
  };
  var result = parser.parse('-fb bar'.split(' '), config);
  assert.equal(result.options.foo, true);
  assert.equal(result.options.bar, 'bar');
});

it('should handle mutiple arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        many: true
      }
    }
  };
  var result = parser.parse('-b bar foo -f'.split(' '), config);
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.options.bar, ['bar', 'foo']);
});

it('should handle mutiple comma-separated arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        many: true
      }
    }
  };
  var result = parser.parse('-b bar,foo -f'.split(' '), config);
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.options.bar, ['bar', 'foo']);
});

it('should handle mutiple separated arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        many: true
      }
    }
  };
  var result = parser.parse('-b bar -f -b foo'.split(' '), config);
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.options.bar, ['bar', 'foo']);
});

it('should handle mutiple flag with single argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        many: true
      }
    }
  };
  var result = parser.parse('-b bar -f'.split(' '), config);
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.options.bar, ['bar']);
});

it('should fail on invalid operand type', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      }
    },
    operands: {
      bar: {
        many: true,
        type: 'number'
      }
    }
  };
  assert.throws(function () {
    parser.parse('-f foo 42'.split(' '));
  });
});

it('should handle mix of single and many operands', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      }
    },
    operands: {
      barFoo: {
        type: 'string'
      },
      bar: {
        many: true,
        type: 'number'
      }
    }
  };
  var result = parser.parse('-f foo 4 2'.split(' '));
  assert.equal(result.options.foo, true);
  assert.equal(result.operands.barFoo, 'foo');
  assert.deepEqual(result.operands.bar, [4, 2]);
});

it('should add many string operands', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string'
      },
    },
    operands: {
      argv: {
        many: true,
        type: 'string'
      }
    }
  };
  var result = parser.parse('-f -b bar foobar bar foo'.split(' '));
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.operands.argv, ['foobar', 'bar', 'foo']);
});

it('should add arguments after terminator to operand', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string'
      },
    },
    operands: {
      argv: {
        many: true,
        type: 'string'
      }
    }
  };
  var result = parser.parse('-f -b bar -- -foobar bar foo'.split(' '));
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.operands.argv, ['-foobar', 'bar', 'foo']);
});

it('should fail with unexpected operand', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        required: true
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        required: true
      },
    }
  };
  assert.throws(function () {
    parser.parse('-f 42 -b bar -foobar'.split(' '));
  });
});

it('should fail when adjacent argument specified', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        type: 'string'
      },
    }
  };
  assert.throws(function () {
    parser.parse('-bfoo'.split(' '));
  });
});

it('should fail when missing required options', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        required: true
      },
    }
  };
  assert.throws(function () {
    parser.parse('--foo'.split(' '));
  });
});

