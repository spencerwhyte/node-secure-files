const crypto = require('crypto');

const encryptionAlgorithm = 'aes-256-cbc';
const encodingScheme = 'base64';
const characterEncoding = 'utf8';

module.exports.encryptData = (plainText, encodedAesKey) => {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(encodedAesKey, encodingScheme);
  const cipher = crypto.createCipheriv(encryptionAlgorithm, key, iv);
  let cipherText = cipher.update(plainText, characterEncoding, encodingScheme);
  cipherText += cipher.final(encodingScheme);
  const ivText = iv.toString(encodingScheme);
  return `${ivText}_${cipherText}`;
};

module.exports.decryptData = (encryptedData, encodedAesKey) => {
  const encryptedDataParts = encryptedData.split('_');
  const iv = Buffer.from(encryptedDataParts[0], encodingScheme);
  const key = Buffer.from(encodedAesKey, encodingScheme);
  const cipherText = encryptedDataParts[1];
  const decipher = crypto.createDecipheriv(encryptionAlgorithm, key, iv);
  let plainText = decipher.update(cipherText, encodingScheme, characterEncoding);
  plainText += decipher.final(characterEncoding);
  return plainText;
};
