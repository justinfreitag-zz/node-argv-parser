# node-argv-parser [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

**node-argv-parser** is a friendly process.argv parser for [Node.js][nodejs]. It
adheres to the [UNIX utility conventions][utility-conventions].

## Usage

```javascript
#!/usr/bin/node

var parse = require('node-argv-parser');

// define options, operands, and help as an object

var config = {
  help: {
    banner: 'make links between files'
  },
  options: {
    backup: {
      default: 'none'
      name: 'CONTROL',
      description: 'make a backup of each existing destination file',
    },
    symbolic: {
      description: 'make symbolic links instead of hard links'
    },
    targetDirectory: {
      require: true,
      name: 'DIRECTORY',
      description: 'remove directories and their contents recursively'
    }
  },
  operands: {
    targets: {
      many: true,
      required: true,
      name: 'TARGET'
    }
  }
};

var args;

try {

  args = parse(argv, config);

} catch (error) {
  // report error
  console.log(error.message + '\n');

  // show help
  console.log(error.help);

  process.exit(1);
}

// use args...

if (args.symbolic) {
  // do something
}
```

## Configuration

The following properties are specific to options and option arguments:

- longId - optional - If not provided, the option key (which is assumed to be in
  camel-case form) will be converted into param-case, e.g. noPreserveRoot ->
  no-preserve-root
- shortId - optional - If not provided, the first character of the option key
  will be used in lower-case or upper-case forms (dependent on availability).
  Conflicts between option short ID's will cause an error to be thrown.

The following properties are applicable to options, option arguments, and
operands:

- required - optional - Defaults to false.
- many - optional - Defaults to false. When false, the option may only be used
  once, with multiple uses causing an error to be thrown. When true, the option
  may be used more than once, with the number of uses captured in the parsed
  result.
- description - optional - Shown as part of the help text.

The following additional properties are for option arguments:

- type - required unless a default is provided - If provided, must be either
  'number' or 'string'. Supports both signed and unsigned numbers.
- default - optional - If provided, may be used to infer type (if type not
  provided).
- parse - optional - If provided, argument parsing will be delegated.
- validate - optional - If provided, argument validation will be delegated to
  it.
- name - optional - Used to create the option argument signature that is shown
  as part of the help text.

### Help

- name -
- banner -

[npm-url]: https://npmjs.org/package/node-argv-parser
[npm-image]: https://badge.fury.io/js/node-argv-parser
[travis-url]: http://travis-ci.org/justinfreitag/node-argv-parser
[travis-image]: https://travis-ci.org/justinfreitag/node-argv-parser.png?branch=master
[depstat-url]: https://david-dm.org/justinfreitag/node-argv-parser
[depstat-image]: https://david-dm.org/justinfreitag/node-argv-parser.png
[nodejs]: http://nodejs.org
[utility-conventions]: http://pubs.opengroup.org/onlinepubs/7908799/xbd/utilconv.html

