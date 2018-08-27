module.exports.decryptedDirectoryPath = basePath => `${basePath}/decrypted`;

module.exports.encryptedDirectoryPath = basePath => `${basePath}/encrypted`;

module.exports.decryptedProjectDirectoryPath = (basePath, projectId) => {
  const decryptedDirectory = this.decryptedDirectoryPath(basePath);
  return `${decryptedDirectory}/${projectId}`;
};

module.exports.encryptedProjectDirectoryPath = (basePath, projectId) => {
  const encryptedDirectory = this.encryptedDirectoryPath(basePath);
  return `${encryptedDirectory}/${projectId}`;
};

module.exports.decryptedFilePath = (basePath, projectId, configFileName) => {
  const decryptionProjectDirectory = this.decryptedProjectDirectoryPath(basePath, projectId);
  return `${decryptionProjectDirectory}/${configFileName}`;
};

module.exports.encryptedFilePath = (basePath, projectId, configFileName) => {
  const encryptionProjectDirectory = this.encryptedProjectDirectoryPath(basePath, projectId);
  return `${encryptionProjectDirectory}/${configFileName}`;
};