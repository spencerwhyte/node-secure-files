const { readdirSync, statSync, readFileSync } = require('fs');
const { join } = require('path');

module.exports.loadJsonFile = (path) => {
  try {
    const jsonFileContents = readFileSync(path, 'utf8');
    return JSON.parse(jsonFileContents);
  } catch (error) {
    return null;
  }
};

module.exports.dirs = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory());

module.exports.configFiles = p => readdirSync(p).filter(f => f.endsWith('.json'));

module.exports.loadSecureFilesJson = () => {
  return this.loadJsonFile('secure-files.json');
};