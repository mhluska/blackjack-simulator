import * as fs from 'fs';
import * as path from 'path';

import Storage from './storage';

const DATABASE_DIR = path.join(__dirname, '..', 'db');

export default class FileStorage implements Storage {
  createRecord(recordName: string, data: { [key: string]: string }): void {
    fs.mkdir(DATABASE_DIR, { recursive: true }, (error) => {
      if (error) {
        throw error;
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
