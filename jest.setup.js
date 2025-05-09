// Mock for BroadcastChannel
if (typeof BroadcastChannel === 'undefined') {
  global.BroadcastChannel = class BroadcastChannel {
    constructor() {
      this.onmessage = null;
    }
    postMessage(message) {
      // Implementation not needed for tests
    }
    close() {
      // Implementation not needed for tests
    }
  };
}

// Mock for IndexedDB
if (typeof indexedDB === 'undefined') {
  global.indexedDB = {
    open: () => {
      const request = {
        onupgradeneeded: null,
        onsuccess: null,
        onerror: null,
        result: {
          transaction: () => ({
            objectStore: () => ({
              get: () => ({}),
              put: () => ({}),
              delete: () => ({}),
              getAllKeys: () => ({})
            }),
            oncomplete: null,
            onerror: null
          })
        }
      };
      setTimeout(() => {
        if (request.onsuccess) request.onsuccess({ target: request });
      }, 0);
      return request;
    }
  };
}

// Mock for localStorage
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
}

// Mock for sessionStorage
if (typeof sessionStorage === 'undefined') {
  global.sessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
}

// React Testing Library Setup
import '@testing-library/jest-dom';