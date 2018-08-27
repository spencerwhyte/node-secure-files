#!/usr/bin/env node

const library = require('../lib/index.js');

if (process.argv.length < 3) {
  console.log('\nProper uses:\n\n    secure-files encrypt\n\nOR\n\n    secure-files decrypt\n');
} else if (process.argv[2] === 'encrypt') {
  library.encryptAll();
} else if (process.argv[2] === 'decrypt') {
  library.decryptAll();
}
