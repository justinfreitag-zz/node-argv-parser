'use strict';

var parser = require('..');

it('should dispaly help for specified config', function() {
  var config = {
    help: {
      banner: 'This utility is responsible for...'
    },
    options: {
      foo: {
        description: 'Test --foo',
        required: true
      },
      bar: {
        description: 'Test --bar',
        name: 'BAR',
        type: 'string',
        required: true
      },
      other: {
        description: 'Test --fooBar',
        required: true
      },
      fooBar: {
        description: 'Test --fooBar',
        many: true,
        type: 'number',
        default: 42
      },
      barFoo: {
        description: 'Test --barFoo',
        many: true,
        type: 'number',
        required: true
      }
    },
    operands: {
      command: {
        name: 'COMMAND',
        required: true,
        type: 'string',
        description: 'Command to run'
      },
      fooFiles: {
        name: 'FILE',
        many: true,
        type: 'string',
        description: 'Test operand FILE'
      }
    }
  };

  parser.parse(['-h'], config);
});

