import * as fs from 'fs';
import * as path from 'path';

import Storage from './storage';

const DEFAULT_DATABASE_DIR = path.join(__dirname, '..', 'db');

export default class FileStorage implements Storage {
  private databaseDir: string;

  constructor(databaseDir?: string) {
    this.databaseDir = databaseDir ?? DEFAULT_DATABASE_DIR;
  }

  createRecord(recordName: string, data: Record<string, unknown>): void {
    fs.mkdirSync(this.databaseDir, { recursive: true });
    fs.appendFileSync(
      path.join(this.databaseDir, `${recordName}.txt`),
      `${JSON.stringify(data)}\n`,
    );
  }
}
