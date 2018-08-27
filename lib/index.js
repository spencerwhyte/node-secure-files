const { writeFileSync } = require('fs');
const mkdirp = require('mkdirp');

const util = require('./util.js');
const pathProvider = require('./pathProvider.js');
const configFile = require('./configFile.js');

function handleEncryptionOfFile(basePath, projectName, configFileName, encodedAesKey, excludeKeys) {
  const encryptedFile = pathProvider.encryptedFilePath(basePath, projectName, configFileName, encodedAesKey, excludeKeys);
  const decryptedFile = pathProvider.decryptedFilePath(basePath, projectName, configFileName, encodedAesKey, excludeKeys);

  const originalEncryptedFileContents = util.loadJsonFile(encryptedFile, {});
  const decryptedOriginalEncryptedFileContents = configFile.decryptFile(encryptedFile, encodedAesKey, excludeKeys, {});
  const encryptedFileContents = configFile.encryptFile(decryptedFile, encodedAesKey, excludeKeys, {});
  const decryptedFileContents = util.loadJsonFile(decryptedFile);

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

  const decryptedFileContents = configFile.decryptFile(encryptedFile, encodedAesKey, excludeKeys, {});
  const decryptedFileData = JSON.stringify(decryptedFileContents, null, 2);

  writeFileSync(decryptedFile, decryptedFileData);
}

function handleEncryptionOfDirectory(basePath, directory, encodedAesKey, exclude) {
  const projectDirectory = pathProvider.decryptedProjectDirectoryPath(basePath, directory);
  const encryptedDirectory = pathProvider.encryptedProjectDirectoryPath(basePath, directory);
  mkdirp.sync(encryptedDirectory);
  const files = util.configFiles(projectDirectory);
  files.forEach((file) => {
    const excludeKeys = exclude[file] || {};
    handleEncryptionOfFile(basePath, directory, file, encodedAesKey, excludeKeys);
  });
}

function handleDecryptionOfDirectory(basePath, directory, encodedAesKey, exclude) {
  const projectDirectory = pathProvider.encryptedProjectDirectoryPath(basePath, directory);
  const decryptedDirectory = pathProvider.decryptedProjectDirectoryPath(basePath, directory);
  mkdirp.sync(decryptedDirectory);
  const files = util.configFiles(projectDirectory);
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
  const subDirectories = util.dirs(decryptedDirectory);
  subDirectories.forEach((projectDirectoryName) => {
    const encodedAesKey = encodedAesKeyForProjectId(projectDirectoryName);
    handleEncryptionOfDirectory(currentWorkingDirectory, projectDirectoryName, encodedAesKey, secureFilesJson.exclude);
  });
}

function handleDecryptionOfAllFiles(secureFilesJson) {
  const currentWorkingDirectory = process.cwd();
  const encryptedDirectory = pathProvider.encryptedDirectoryPath(currentWorkingDirectory);
  const subDirectories = util.dirs(encryptedDirectory);
  subDirectories.forEach((projectDirectoryName) => {
    const encodedAesKey = encodedAesKeyForProjectId(projectDirectoryName);
    handleDecryptionOfDirectory(currentWorkingDirectory, projectDirectoryName, encodedAesKey, secureFilesJson.exclude);
  });
}

module.exports.encryptAll = () => {
  const secureFilesJson = util.loadSecureFilesJson();
  if (secureFilesJson == null) {
    console.error('Could not find secure-files.json. Make sure that you are running this file from the directory containing secure-files.json');
  } else {
    handleEncryptionOfAllFiles(secureFilesJson);
  }
};

module.exports.decryptAll = () => {
  const secureFilesJson = util.loadSecureFilesJson();
  if (secureFilesJson == null) {
    console.error('Could not find secure-files.json. Make sure that you are running this file from the directory containing secure-files.json');
  } else {
    handleDecryptionOfAllFiles(secureFilesJson);
  }
};
