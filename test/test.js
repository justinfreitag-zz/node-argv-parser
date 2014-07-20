'use strict';

var ArgvParser = require('..');

var argv = {
  foo: {
    description: 'Test --foo',
    type: 'boolean',
    required: true,
    default: true
  },
  bar: {
    description: 'Test --bar',
    type: 'string',
    required: false
  },
  fooBar: {
    description: 'Test --foo-bar',
    type: 'string',
    required: true
  }
};


it('should show help', function() {
  var parser = new ArgvParser(argv);
  parser.parse();
});


