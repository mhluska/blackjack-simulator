import fs from 'fs';
import path from 'path';
import Storage from './storage.js';

const DATABASE_DIR = path.join(__dirname, '..', 'db');

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
