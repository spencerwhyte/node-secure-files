const { readdirSync, statSync, readFileSync, writeFileSync } = require('fs')
const { join } = require('path');
const mkdirp = require('mkdirp');
const crypto = require('./crypto.js');
const pathProvider = require('./pathProvider.js');

const dirs = p => readdirSync(p).filter(f => statSync(join(p, f)).isDirectory());
const configFiles = p => readdirSync(p).filter(f => f.endsWith('.json'));

function loadSecureFilesJson() {
  try {
    const jsonFileContents = readFileSync('secure-files.json', 'utf8');
    return JSON.parse(jsonFileContents);
  } catch (error) {
    return null;
  }
}

function loadJsonFile(path) {
  try {
    const jsonFileContents = readFileSync(path, 'utf8');
    return JSON.parse(jsonFileContents);
  } catch (error) {
    return null;
  }
}

function encryptFile(path, encodedAesKey, excludeKeys, fallback = null) {
  const jsonRepresentation = loadJsonFile(path);
  if (jsonRepresentation == null) {
    return fallback;
  }
  const jsonKeys = Object.keys(jsonRepresentation);
  jsonKeys.forEach((jsonKey) => {
    const encryptedJsonValue = jsonRepresentation[jsonKey];
    if (excludeKeys[jsonKey] !== true) {
      const decryptedJsonValue = crypto.encryptData(encryptedJsonValue, encodedAesKey);
      jsonRepresentation[jsonKey] = decryptedJsonValue;
    }
  });
  return jsonRepresentation;
}

function decryptFile(path, encodedAesKey, excludeKeys, fallback = null) {
  const jsonRepresentation = loadJsonFile(path);
  if (jsonRepresentation == null) {
    return fallback;
  }
  const jsonKeys = Object.keys(jsonRepresentation);
  jsonKeys.forEach((jsonKey) => {
    const encryptedJsonValue = jsonRepresentation[jsonKey];
    if (excludeKeys[jsonKey] !== true) {
      const decryptedJsonValue = crypto.decryptData(encryptedJsonValue, encodedAesKey);
      jsonRepresentation[jsonKey] = decryptedJsonValue;
    }
  });
  return jsonRepresentation;
}

function handleEncryptionOfFile(basePath, projectName, configFileName, encodedAesKey, excludeKeys) {
  const encryptedFile = pathProvider.encryptedFilePath(basePath, projectName, configFileName, encodedAesKey, excludeKeys);
  const decryptedFile = pathProvider.decryptedFilePath(basePath, projectName, configFileName, encodedAesKey, excludeKeys);

  const originalEncryptedFileContents = loadJsonFile(encryptedFile, {});
  const decryptedOriginalEncryptedFileContents = decryptFile(encryptedFile, encodedAesKey, excludeKeys, {});
  const encryptedFileContents = encryptFile(decryptedFile, encodedAesKey, excludeKeys, {});
  const decryptedFileContents = loadJsonFile(decryptedFile);

  const jsonKeys = Object.keys(decryptedFileContents);
  jsonKeys.forEach((jsonKey) => {
    if (decryptedFileContents[jsonKey] === decryptedOriginalEncryptedFileContents[jsonKey]) {
      encryptedFileContents[jsonKey] = originalEncryptedFileContents[jsonKey];
    }
  });

  const updatedEncryptedFileContents = JSON.stringify(encryptedFileContents, null, 2);

  writeFileSync(encryptedFile, updatedEncryptedFileContents);
}

function handleDecryptionOfFile(basePath, projectName, configFileName, encodedAesKey, excludeKeys) {
  const encryptedFile = pathProvider.encryptedFilePath(basePath, projectName, configFileName, encodedAesKey, excludeKeys);
  const decryptedFile = pathProvider.decryptedFilePath(basePath, projectName, configFileName, encodedAesKey, excludeKeys);

  const decryptedFileContents = decryptFile(encryptedFile, encodedAesKey, excludeKeys, {});
  const decryptedFileData = JSON.stringify(decryptedFileContents, null, 2);

  writeFileSync(decryptedFile, decryptedFileData);
}

function handleEncryptionOfDirectory(basePath, directory, encodedAesKey, exclude) {
  const projectDirectory = pathProvider.decryptedProjectDirectoryPath(basePath, directory);
  const encryptedDirectory = pathProvider.encryptedProjectDirectoryPath(basePath, directory);
  mkdirp.sync(encryptedDirectory);
  const files = configFiles(projectDirectory);
  files.forEach((file) => {
    const excludeKeys = exclude[file] || {};
    handleEncryptionOfFile(basePath, directory, file, encodedAesKey, excludeKeys);
  });
}

function handleDecryptionOfDirectory(basePath, directory, encodedAesKey, exclude) {
  const projectDirectory = pathProvider.encryptedProjectDirectoryPath(basePath, directory);
  const decryptedDirectory = pathProvider.decryptedProjectDirectoryPath(basePath, directory);
  mkdirp.sync(decryptedDirectory);
  const files = configFiles(projectDirectory);
  files.forEach((file) => {
    const excludeKeys = exclude[file] || {};
    handleDecryptionOfFile(basePath, directory, file, encodedAesKey, excludeKeys);
  });
}

function encodedAesKeyForProjectId(projectId) {
  const transformedProjectId = projectId.split('-').join('_').toUpperCase();
  const aesSecretKey = `AES_SECRET_${transformedProjectId}`;
  return process.env[aesSecretKey];
}

function handleEncryptionOfAllFiles(secureFilesJson) {
  const currentWorkingDirectory = process.cwd();
  const decryptedDirectory = pathProvider.decryptedDirectoryPath(currentWorkingDirectory);
  const subDirectories = dirs(decryptedDirectory);
  subDirectories.forEach((projectDirectoryName) => {
    const encodedAesKey = encodedAesKeyForProjectId(projectDirectoryName);
    handleEncryptionOfDirectory(currentWorkingDirectory, projectDirectoryName, encodedAesKey, secureFilesJson.exclude);
  });
}

function handleDecryptionOfAllFiles(secureFilesJson) {
  const currentWorkingDirectory = process.cwd();
  const encryptedDirectory = pathProvider.encryptedDirectoryPath(currentWorkingDirectory);
  const subDirectories = dirs(encryptedDirectory);
  subDirectories.forEach((projectDirectoryName) => {
    const encodedAesKey = encodedAesKeyForProjectId(projectDirectoryName);
    console.log(encodedAesKey);
    handleDecryptionOfDirectory(currentWorkingDirectory, projectDirectoryName, encodedAesKey, secureFilesJson.exclude);
  });
}

module.exports.encryptAll = () => {
  const secureFilesJson = loadSecureFilesJson();
  if (secureFilesJson == null) {
    console.error('Could not find secure-files.json. Make sure that you are running this file from the directory containing secure-files.json');
  } else {
    handleEncryptionOfAllFiles(secureFilesJson);
  }
};

module.exports.decryptAll = () => {
  const secureFilesJson = loadSecureFilesJson();
  if (secureFilesJson == null) {
    console.error('Could not find secure-files.json. Make sure that you are running this file from the directory containing secure-files.json');
  } else {
    handleDecryptionOfAllFiles(secureFilesJson);
  }
};
