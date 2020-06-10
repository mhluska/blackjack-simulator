import fs from 'fs';
import path from 'path';
import Storage from '../storage.js';

console.assert(process.env.APP_ROOT, 'APP_ROOT env variable is not defined');

const DATABASE_DIR = path.join(process.env.APP_ROOT, 'db');

export default class FileStorage extends Storage {
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
}
