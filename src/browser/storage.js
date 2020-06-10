import Storage from '../storage.js';
import { apiOrigin } from '../constants.js';

export default class FileStorage extends Storage {
  static createRecord(recordName, data) {
    return this._postData(apiOrigin, data);
  }

  static async _postData(url, data = {}) {
    // See https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#Supplying_request_options
    const response = await fetch(url, {
      method: 'POST',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.json();
  }
}
