'use strict';

var assert = require('assert');

var ArgvParser = require('..');

it('should hande short options', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'string'
      },
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-f -b bar'.split(' '));
  assert.equal(result.options.foo, true);
  assert.equal(result.options.bar, 'bar');
});

it('should hande long options', function() {
  var config = {
    options: {
      fooBar: {
        description: 'Test --fooBar',
      },
      barFoo: {
        description: 'Test --barFoo',
        type: 'string'
      },
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('--foo-bar --bar-foo bar'.split(' '));
  assert.equal(result.options.fooBar, true);
  assert.equal(result.options.barFoo, 'bar');
});

it('should fail when long option missing -- prefix', function() {
  var config = {
    options: {
      fooBar: {
        description: 'Test --fooBar',
      },
      barFoo: {
        description: 'Test --barFoo',
        type: 'string'
      },
    }
  };
  var parser = new ArgvParser(config);
  assert.throws(function () {
    console.log(parser.parse('-foo-bar --bar-foo bar'.split(' ')));
  });
});


it('should fail when long option missing -- prefix', function() {
  var config = {
    options: {
      fooBar: {
        description: 'Test --fooBar',
      },
      barFoo: {
        description: 'Test --barFoo',
        type: 'string'
      },
    }
  };
  var parser = new ArgvParser(config);
  assert.throws(function () {
    console.log(parser.parse('-foo-bar --bar-foo bar'.split(' ')));
  });
});

it('should fail when unknown option specified', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      }
    }
  };
  var parser = new ArgvParser(config);
  assert.throws(function () {
    parser.parse('-f -F'.split(' '));
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
  var parser = new ArgvParser(config);
  assert.throws(function () {
    parser.parse('-f'.split(' '));
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
  var parser = new ArgvParser(config);
  assert.throws(function () {
    parser.parse('-b boo'.split(' '));
  });
});

it('should apply default when option missing', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'number',
        value: 42
      }
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-f'.split(' '));
  assert.equal(result.options.foo, true);
  assert.strictEqual(result.options.bar, 42);
});

it('should fail on default/type mismatch', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        value: 42
      }
    }
  };
  var parser = new ArgvParser(config);
  assert.throws(function () {
    parser.parse('-b bar'.split(' '));
  });
});

it('should fail on required and default property mismatch', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        value: 'bar',
        required: true
      }
    }
  };
  assert.throws(function () {
    new ArgvParser(config);
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
    new ArgvParser(config);
  });
});

// TODO add suport for array values, implies multiple=true
it('should fail on unknown default value type', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        value: ['foo', 'bar']
      }
    }
  };
  assert.throws(function () {
    new ArgvParser(config);
  });
});

it('should handle condensed short options', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'string'
      },
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-fb bar'.split(' '));
  assert.equal(result.options.foo, true);
  assert.equal(result.options.bar, 'bar');
});

it('should handle mutiple arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        multiple: true
      }
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-b bar foo -f'.split(' '));
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.options.bar, ['bar', 'foo']);
});

it('should handle mutiple comma-separated arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        multiple: true
      }
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-b bar,foo -f'.split(' '));
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.options.bar, ['bar', 'foo']);
});

it('should handle mutiple separated arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        multiple: true
      }
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-b bar -f -b foo'.split(' '));
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.options.bar, ['bar', 'foo']);
});

it('should handle mutiple flag with single argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
        multiple: true
      }
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-b bar -f'.split(' '));
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.options.bar, ['bar']);
});

it('should add everything after option terminator to operands', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
      },
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-f -b bar -- -foobar'.split(' '));
  assert.equal(result.options.foo, true);
  assert.equal(result.operands[0], '-foobar');
});

it('should add interspersed values as operands', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      },
      bar: {
        description: 'Test --bar',
        type: 'string',
      },
    }
  };
  var parser = new ArgvParser(config);
  var result = parser.parse('-f 42 -b bar barfoo -- -foobar'.split(' '));
  assert.equal(result.options.foo, true);
  assert.deepEqual(result.operands, [42, 'barfoo', '-foobar']);
});

it('should fail when adjacent argument specified', function() {
  var config = {
    options: {
      bar: {
        description: 'Test --bar',
        type: 'string',
      },
    }
  };
  var parser = new ArgvParser(config);
  assert.throws(function () {
    parser.parse('-bfoo'.split(' '));
  });
});

