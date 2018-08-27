const crypto = require('./crypto.js');
const util = require('./util.js');

function process(path, encodedAesKey, excludeKeys, fallback = null, processor) {
  const jsonRepresentation = util.loadJsonFile(path);
  if (jsonRepresentation == null) {
    return fallback;
  }
  const jsonKeys = Object.keys(jsonRepresentation);
  jsonKeys.forEach((jsonKey) => {
    const encryptedJsonValue = jsonRepresentation[jsonKey];
    if (excludeKeys[jsonKey] !== true) {
      const decryptedJsonValue = processor(encryptedJsonValue, encodedAesKey);
      jsonRepresentation[jsonKey] = decryptedJsonValue;
    }
  });
  return jsonRepresentation;
}

module.exports.encryptFile = (path, encodedAesKey, excludeKeys, fallback = null) => {
  const encryptedJson = process(path, encodedAesKey, excludeKeys, fallback, crypto.encryptData);
  return encryptedJson;
};

module.exports.decryptFile = (path, encodedAesKey, excludeKeys, fallback = null) => {
  const decryptedJson = process(path, encodedAesKey, excludeKeys, fallback, crypto.decryptData);
  return decryptedJson;
};
