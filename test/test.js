'use strict';

var assert = require('assert');
var parse = require('..');

it('should hande short option', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      }
    }
  };
  var result = parse(['-f'], config);
  assert.equal(result.foo, true);
});

it('should hande short option argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string'
      }
    }
  };
  var result = parse('-f bar'.split(' '), config);
  assert.equal(result.foo, 'bar');
});

it('should hande long option', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
      }
    }
  };
  var result = parse(['-f'], config);
  assert.equal(result.foo, true);
});

it('should hande long option argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string'
      }
    }
  };
  var result = parse('-f bar'.split(' '), config);
  assert.equal(result.foo, 'bar');
});

it('should handle short option with assigned argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'number'
      }
    }
  };
  var result = parse(['-f=42'], config);
  assert.equal(result.foo, 42);
});

it('should handle short option with adjacent argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'number'
      }
    }
  };
  var result = parse(['-f42'], config);
  assert.equal(result.foo, 42);
});

it('should handle long option with assigned argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'number'
      }
    }
  };
  var result = parse(['--foo=42'], config);
  assert.equal(result.foo, 42);
});

it('should fail when long option missing argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string'
      },
    }
  };
  assert.throws(function () {
    parse(['--foo'], config);
  });
});

it('should fail when unknown option specified', function() {
  assert.throws(function () {
    parse(['-f']);
  });
});

it('should fail when short option missing argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string'
      }
    }
  };
  assert.throws(function () {
    parse(['-f'], config);
  });
});

it('should fail when invalid argument specified', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'number'
      }
    }
  };
  assert.throws(function () {
    parse('-f bar'.split(' '), config);
  });
});

it('should handle signed number argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'number'
      }
    }
  };
  var result = parse('-f -42'.split(' '), config);
  assert.strictEqual(result.foo, -42);
});

it('should defer parsing', function() {
  var config = {
    options: {
      foo: {
        type: 'string',
        description: 'Test --foo',
        parse: function (value) {
          assert.equal(value, 'foo');
          return 'bar';
        }
      }
    }
  };
  var result = parse('-f foo'.split(' '), config);
  assert.strictEqual(result.foo, 'bar');
});

it('should defer validation', function() {
  var config = {
    options: {
      foo: {
        type: 'string',
        description: 'Test --foo',
        validate: function (value) {
          assert.equal(value, 'foo');
          return true;
        }
      }
    }
  };
  var result = parse('-f foo'.split(' '), config);
  assert.strictEqual(result.foo, 'foo');
});

it('should defer validation following parse', function() {
  var config = {
    options: {
      foo: {
        type: 'number',
        description: 'Test --foo',
        validate: function (value) {
          assert.equal(value, 42);
        }
      }
    }
  };
  var result = parse('-f 42'.split(' '), config);
  assert.strictEqual(result.foo, 42);
});

it('should fail deferred validation', function() {
  var config = {
    options: {
      foo: {
        type: 'number',
        description: 'Test --foo',
        validate: function () {
          throw new Error();
        }
      }
    }
  };
  assert.throws(function () {
    parse('-f foo'.split(' '), config);
  });
});

it('should apply default when option missing', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'number',
        default: 42
      }
    }
  };
  var result = parse([], config);
  assert.equal(result.foo, 42);
});

it('should fail on default/type mismatch', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        default: 42
      }
    }
  };
  assert.throws(function () {
    parse('-f bar'.split(' '), config);
  });
});

it('should fail on required and default property mismatch', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        default: 'bar',
        required: true
      }
    }
  };
  assert.throws(function () {
    parse([], config);
  });
});

it('should fail on unknown option property', function() {
  var config = {
    options: {
      foo: {
        bar: 'Test --foo'
      }
    }
  };
  assert.throws(function () {
    parse([], config);
  });
});

it('should handle option argument with implied type', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        default: 42
      }
    }
  };
  var result = parse('-f 43'.split(' '), config);
  assert.equal(result.foo, 43);
});

it('should handle condensed option array type', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        many: true
      }
    }
  };
  var result = parse(['-fff'], config);
  assert.equal(result.foo, 3);
});

it('should handle separated option array type', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        many: true
      }
    }
  };
  var result = parse('-f -f -f'.split(' '), config);
  assert.equal(result.foo, 3);
});

it('should handle option argument with implied array type', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        default: ['foo']
      }
    }
  };
  var result = parse('-f bar 42'.split(' '), config);
  assert.deepEqual(result.foo, ['bar', '42']);
});

it('should fail on empty default array', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        default: []
      }
    }
  };
  assert.throws(function () {
    parse([], config);
  });
});

it('should fail on unknown default value type', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        default: {foo: 42}
      }
    }
  };
  assert.throws(function () {
    parse([], config);
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
      },
    }
  };
  var result = parse(['-fb'], config);
  assert.equal(result.foo, true);
  assert.equal(result.bar, true);
});

it('should handle condensed short options with adjacent argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'number'
      },
    }
  };
  var result = parse(['-fb42'], config);
  assert.equal(result.foo, true);
  assert.equal(result.bar, 42);
});

it('should handle condensed short options with assignment', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'number'
      },
    }
  };
  var result = parse(['-fb=42'], config);
  assert.equal(result.foo, true);
  assert.equal(result.bar, 42);
});

it('should handle condensed short options separate argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'number'
      },
    }
  };
  var result = parse(['-fb 42'], config);
  assert.equal(result.foo, true);
  assert.equal(result.bar, 42);
});

it('should handle assignment inside condensed short options', function() {
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
  var result = parse(['-fb4=2'], config);
  assert.equal(result.foo, true);
  assert.equal(result.bar, '4=2');
});

it('should fail when condensed short options missing argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo'
      },
      bar: {
        description: 'Test --bar',
        type: 'number'
      },
    }
  };
  assert.throws(function () {
    parse(['-fb'], config);
  });
});

it('should handle mutiple arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse('-f foo bar'.split(' '), config);
  assert.deepEqual(result.foo, ['foo', 'bar']);
});

it('should handle mutiple arguments with adjacency', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse('-ffoo bar'.split(' '), config);
  assert.deepEqual(result.foo, ['foo', 'bar']);
});

it('should handle mutiple arguments with assignment', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse('-f=foo bar'.split(' '), config);
  assert.deepEqual(result.foo, ['foo', 'bar']);
});

it('should handle comma separated arguments', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse('-f foo,bar'.split(' '), config);
  assert.deepEqual(result.foo, ['foo', 'bar']);
});

it('should handle comma separated arguments with adjacency', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse('-ffoo,bar'.split(' '), config);
  assert.deepEqual(result.foo, ['foo', 'bar']);
});

it('should handle comma separated arguments with assignment', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse('-f=foo,bar'.split(' '), config);
  assert.deepEqual(result.foo, ['foo', 'bar']);
});

it('should handle comma separated argument mix', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse('-f=foo,bar 42'.split(' '), config);
  assert.deepEqual(result.foo, ['foo', 'bar', '42']);
});

it('should handle many flag with single argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse('-f bar'.split(' '), config);
  assert.deepEqual(result.foo, ['bar']);
});

it('should handle operands with default config', function() {
  var result = parse(['42']);
  assert.equal(result.argv[0], '42');
});

it('should fail on invalid operand type', function() {
  var config = {
    operands: {
      foo: {
        many: true,
        type: 'number'
      }
    }
  };
  assert.throws(function () {
    parse(['foo'], config);
  });
});

it('should fail on unknown operand', function() {
  var config = {
    operands: {
      foo: {
        type: 'string'
      }
    }
  };
  assert.throws(function () {
    parse('foo bar'.split(' '), config);
  });
});

it('should handle single and many operand mix', function() {
  var config = {
    operands: {
      foo: {
        type: 'number'
      },
      bar: {
        many: true,
        type: 'string'
      }
    }
  };
  var result = parse('42 foo bar'.split(' '), config);
  assert.equal(result.foo, 42);
  assert.deepEqual(result.bar, ['foo', 'bar']);
});

it('should add arguments after terminator to default operand', function() {
  var result = parse('-- -f'.split(' '));
  assert.deepEqual(result.argv, ['-f']);
});

it('should fail with unexpected operand', function() {
  var config = {
    operands: {
      foo: {
        description: 'Test --foo',
        type: 'string',
      }
    }
  };
  assert.throws(function () {
    parse('foo bar'.split(' '), config);
  });
});

it('should handle non-numeric operand without type as string', function() {
  var config = {
    operands: {
      foo: {
        description: 'Test --foo'
      }
    }
  };
  var result = parse(['foo'], config);
  assert.equal(result.foo, 'foo');
});

it('should handle numeric operand without type as string', function() {
  var config = {
    operands: {
      foo: {
        description: 'Test --foo'
      }
    }
  };
  var result = parse(['42'], config);
  assert.equal(typeof result.foo, 'string');
});

it('should handle operand with implied type', function() {
  var config = {
    operands: {
      foo: {
        description: 'Test --foo',
        default: 42
      }
    }
  };
  var result = parse(['43'], config);
  assert.deepEqual(result.foo, 43);
});

it('should handle comma separated operands', function() {
  var config = {
    operands: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        many: true
      }
    }
  };
  var result = parse(['foo,bar'], config);
  assert.deepEqual(result.foo, ['foo', 'bar']);
});

it('should handle escaped option argument', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        type: 'string'
      }
    }
  };
  var result = parse('-f "foo,bar"'.split(' '), config);
  assert.deepEqual(result.foo, 'foo,bar');
});

it('should handle escaped operands', function() {
  var config = {
    operands: {
      foo: {
        description: 'Test --foo',
        type: 'string'
      }
    }
  };
  var result = parse(['"foo,bar"'], config);
  assert.deepEqual(result.foo, 'foo,bar');
});

it('should fail when missing required operand', function() {
  var config = {
    operands: {
      foo: {
        description: 'Test --foo',
        type: 'string',
        required: true
      }
    }
  };
  assert.throws(function () {
    parse([], config);
  });
});

it('should fail when missing required option', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        required: true
      }
    }
  };
  assert.throws(function () {
    parse([], config);
  });
});

