import fs from 'fs';
import path from 'path';
import Storage from './storage';

const DATABASE_DIR = path.join(__dirname, '..', 'db');

export default class FileStorage extends Storage {
  static createRecord(recordName: string, data: { [key: string]: string}): void {
    fs.mkdir(DATABASE_DIR, { recursive: true }, (error: Error) => {
      if (error) {
        throw error;
      }
    });

    fs.appendFile(
      path.join(DATABASE_DIR, `${recordName}.txt`),
      `${JSON.stringify(data)}\n`,
      (error: Error) => {
        if (error) {
          throw error;
        }
      }
    );
  }
}
