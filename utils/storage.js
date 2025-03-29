/**
 * Storage utilities for Action Tracker extension
 * Handles saving and retrieving data in a structured format
 */

// Base storage class
class Storage {
  constructor() {
    this.initialized = false;
  }

  // Initialize storage
  async init() {
    if (this.initialized) return;
    this.initialized = true;
  }

  // Save data with a key
  async save(key, data) {
    throw new Error('Method not implemented');
  }

  // Get data by key
  async get(key) {
    throw new Error('Method not implemented');
  }

  // Delete data by key
  async delete(key) {
    throw new Error('Method not implemented');
  }

  // List all keys
  async listKeys() {
    throw new Error('Method not implemented');
  }
}

// Chrome storage implementation
class ChromeStorage extends Storage {
  constructor(storageArea = 'local') {
    super();
    this.storage = chrome.storage[storageArea];
  }

  async init() {
    await super.init();
    // No additional initialization needed for chrome.storage
  }

  async save(key, data) {
    return new Promise((resolve, reject) => {
      const item = {};
      item[key] = data;
      this.storage.set(item, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  async get(key) {
    return new Promise((resolve, reject) => {
      this.storage.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  async delete(key) {
    return new Promise((resolve, reject) => {
      this.storage.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  async listKeys() {
    return new Promise((resolve, reject) => {
      this.storage.get(null, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(Object.keys(items));
        }
      });
    });
  }
}

// Session storage manager
class SessionStorage {
  constructor() {
    this.storage = new ChromeStorage('local');
    this.sessionPrefix = 'session_';
    this.eventPrefix = 'events_';
    this.metadataPrefix = 'metadata_';
  }

  async init() {
    await this.storage.init();
  }

  // Save session metadata
  async saveSessionMetadata(sessionId, metadata) {
    const key = `${this.metadataPrefix}${sessionId}`;
    await this.storage.save(key, JSON.stringify(metadata));
  }

  // Get session metadata
  async getSessionMetadata(sessionId) {
    const key = `${this.metadataPrefix}${sessionId}`;
    const data = await this.storage.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Save session data
  async saveSession(sessionId, sessionData) {
    const key = `${this.sessionPrefix}${sessionId}`;
    await this.storage.save(key, JSON.stringify(sessionData));
  }

  // Get session data
  async getSession(sessionId) {
    const key = `${this.sessionPrefix}${sessionId}`;
    const data = await this.storage.get(key);
    return data ? JSON.parse(data) : null;
  }

  // Save events batch
  async saveEvents(sessionId, batchId, events) {
    const key = `${this.eventPrefix}${sessionId}_${batchId}`;
    await this.storage.save(key, JSON.stringify(events));
  }

  // Get events batch
  async getEventsBatch(sessionId, batchId) {
    const key = `${this.eventPrefix}${sessionId}_${batchId}`;
    const data = await this.storage.get(key);
    return data ? JSON.parse(data) : [];
  }

  // List all event batches for a session
  async listEventBatches(sessionId) {
    const allKeys = await this.storage.listKeys();
    const prefix = `${this.eventPrefix}${sessionId}_`;
    return allKeys.filter(key => key.startsWith(prefix))
      .map(key => key.substring(prefix.length));
  }

  // List all sessions
  async listSessions() {
    const allKeys = await this.storage.listKeys();
    return allKeys
      .filter(key => key.startsWith(this.sessionPrefix))
      .map(key => key.substring(this.sessionPrefix.length));
  }

  // Delete a session and all its data
  async deleteSession(sessionId) {
    // Delete session data
    await this.storage.delete(`${this.sessionPrefix}${sessionId}`);
    
    // Delete metadata
    await this.storage.delete(`${this.metadataPrefix}${sessionId}`);
    
    // Delete all event batches
    const batches = await this.listEventBatches(sessionId);
    for (const batchId of batches) {
      await this.storage.delete(`${this.eventPrefix}${sessionId}_${batchId}`);
    }
  }
}

// Export storage classes
export { Storage, ChromeStorage, SessionStorage };
