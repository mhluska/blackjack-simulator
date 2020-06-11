const fs = require('fs');
const path = require('path');

const APP_DIR = path.dirname(require.main.filename);
const DATABASE_DIR = path.join(APP_DIR, '..', 'db');

// Layer of indirection between storage medium (currently file-based but can be
// database, for example).
module.exports = class Storage {
  static createRecord(recordName, data) {
    fs.mkdir(DATABASE_DIR, { recursive: true }, (error) => {
      if (error) {
        throw err;
      }
    });

    fs.appendFile(
      path.join(DATABASE_DIR, `${recordName}.txt`),
      `${JSON.stringify(data)}\n`,
      (error) => {
        if (error) {
          throw error;
        }
      }
    );
  }
};
