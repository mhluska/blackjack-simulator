import * as chai from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import FileStorage from '../../src/file-storage';

const expect = chai.expect;

describe('FileStorage', function () {
  let tempDir: string;
  let storage: FileStorage;

  beforeEach(function () {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'blackjack-test-'));
    storage = new FileStorage(tempDir);
  });

  afterEach(function () {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  describe('#createRecord()', function () {
    it('should write a record file to the database directory', function () {
      const data = { result: 'win', amount: '100' };
      storage.createRecord('test-record', data);

      const filePath = path.join(tempDir, 'test-record.txt');
      expect(fs.existsSync(filePath)).to.be.true;

      const contents = fs.readFileSync(filePath, 'utf-8').trim();
      expect(JSON.parse(contents)).to.deep.equal(data);
    });

    it('should create the database directory if it does not exist', function () {
      // Remove the temp dir to simulate a fresh state where the directory
      // does not exist yet.
      fs.rmSync(tempDir, { recursive: true, force: true });

      const data = { result: 'loss', amount: '50' };
      storage.createRecord('test-record', data);

      const filePath = path.join(tempDir, 'test-record.txt');
      expect(fs.existsSync(filePath)).to.be.true;

      const contents = fs.readFileSync(filePath, 'utf-8').trim();
      expect(JSON.parse(contents)).to.deep.equal(data);
    });

    it('should append multiple records to the same file', function () {
      const data1 = { result: 'win', amount: '100' };
      const data2 = { result: 'loss', amount: '50' };

      storage.createRecord('test-record', data1);
      storage.createRecord('test-record', data2);

      const filePath = path.join(tempDir, 'test-record.txt');
      const lines = fs.readFileSync(filePath, 'utf-8').trim().split('\n');

      expect(lines).to.have.lengthOf(2);
      expect(JSON.parse(lines[0])).to.deep.equal(data1);
      expect(JSON.parse(lines[1])).to.deep.equal(data2);
    });
  });
});
