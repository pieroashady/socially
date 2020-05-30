function directoryNames() {
  const { lstatSync, readdirSync } = require('fs');
  const { join } = require('path');

  const isDirectory = lstatSync('../../dataset/Aldi').isDirectory();
  const getDirectories = readdirSync('../../dataset/Aldi').map((name) => join(name));

  return getDirectories;
}

console.log(directoryNames());
