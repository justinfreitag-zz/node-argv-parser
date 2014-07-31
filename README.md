# node-argv-parser [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

**node-argv-parser** is a friendly process.argv parser for [Node.js][nodejs]. It
adheres to the [UNIX Utility Conventions][utility-conventions].

## Usage

```javascript
#!/usr/bin/node

var parse = require('node-argv-parser');

// define options, operands, and help as an object

var config = {
  help: {
    banner: 'remove files or directories'
  },
  options: {
    noPreserveRoot: {
      description: 'do not treat "/" specially'
    },
    recursive: {
      description: 'remove directories and their contents recursively'
    },
    force: {
      description: 'ignore nonexistent files and arguments, never prompt'
    }
  },
  operands: {
    files: {
      name: 'FILE',
      many: true,
      required: true
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

if (args.noPreserveRoot && args.force && args.files[0] === '/') {
  console.log('Everything is awesome!');
}
```

## Configuration

### Options

- id -
- longId -
- shortId -
- description -
- required -
- many -

The following additional properties are for option arguments:

- name -
- type -
- default -
- parse -
- validate -

### Operands

- id -
- description -
- required -
- many -
- name -
- type -
- default -
- parse -
- validate -

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

