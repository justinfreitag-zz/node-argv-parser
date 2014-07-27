'use strict';

//var assert = require('assert');
var ArgvParser = require('..');

it('should dispaly help for specified config', function() {
  var config = {
    options: {
      foo: {
        description: 'Test --foo',
        required: true
      },
      bar: {
        description: 'Test --bar',
        hint: 'BAR',
        type: 'string',
        required: true
      },
      fooBar: {
        description: 'Test --fooBar',
        multiple: true,
        type: 'number',
        value: 42
      },
      barFoo: {
        description: 'Test --barFoo',
        multiple: true,
        type: 'number',
        required: true
      }
    }
  };
  var parser = new ArgvParser(config);
  parser.help(process.stdout);
});

