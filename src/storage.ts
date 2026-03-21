export default interface Storage {
  createRecord(recordName: string, data: Record<string, unknown>): void;
}
