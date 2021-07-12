export default interface Storage {
  createRecord(recordName: string, data: { [key: string]: string }): void;
}
