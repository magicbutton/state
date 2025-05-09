import { StorageAdapter, StorageAdapterType } from '../types';

/**
 * Local storage adapter implementation
 */
export const localStorageAdapter: StorageAdapter = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error retrieving ${key} from localStorage:`, error);
      return null;
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error storing ${key} in localStorage:`, error);
    }
  },
  
  delete(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from localStorage:`, error);
    }
  },
  
  clear(): void {
    try {
      // Only clear items with our prefix
      const keysToRemove = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('state:')) {
          keysToRemove.push(key);
        }
      }
      
      for (const key of keysToRemove) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }
};

/**
 * Session storage adapter implementation
 */
export const sessionStorageAdapter: StorageAdapter = {
  get<T>(key: string): T | null {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error retrieving ${key} from sessionStorage:`, error);
      return null;
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error storing ${key} in sessionStorage:`, error);
    }
  },
  
  delete(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing ${key} from sessionStorage:`, error);
    }
  },
  
  clear(): void {
    try {
      // Only clear items with our prefix
      const keysToRemove = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('state:')) {
          keysToRemove.push(key);
        }
      }
      
      for (const key of keysToRemove) {
        sessionStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing sessionStorage:', error);
    }
  }
};

/**
 * In-memory storage adapter implementation
 */
export const memoryStorageAdapter = (): StorageAdapter => {
  const storage = new Map<string, string>();
  
  return {
    get<T>(key: string): T | null {
      try {
        const item = storage.get(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.error(`Error retrieving ${key} from memory storage:`, error);
        return null;
      }
    },
    
    set<T>(key: string, value: T): void {
      try {
        storage.set(key, JSON.stringify(value));
      } catch (error) {
        console.error(`Error storing ${key} in memory storage:`, error);
      }
    },
    
    delete(key: string): void {
      storage.delete(key);
    },
    
    clear(): void {
      // Clear only keys with our prefix
      for (const key of storage.keys()) {
        if (key.startsWith('state:')) {
          storage.delete(key);
        }
      }
    }
  };
};

/**
 * IndexedDB storage adapter implementation
 */
export const indexedDBAdapter = (): StorageAdapter => {
  const DB_NAME = 'magicbutton_state';
  const STORE_NAME = 'state_store';
  const DB_VERSION = 1;
  
  let db: IDBDatabase | null = null;
  
  // Open the database
  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (db) {
        resolve(db);
        return;
      }
      
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      
      request.onsuccess = (event) => {
        db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };
      
      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
      };
    });
  };
  
  // Get a value from IndexedDB
  const get = async <T>(key: string): Promise<T | null> => {
    try {
      const db = await openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        
        request.onsuccess = () => {
          resolve(request.result || null);
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to get item with key: ${key}`));
        };
      });
    } catch (error) {
      console.error(`Error retrieving ${key} from IndexedDB:`, error);
      return null;
    }
  };
  
  // Set a value in IndexedDB
  const set = async <T>(key: string, value: T): Promise<void> => {
    try {
      const db = await openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to set item with key: ${key}`));
        };
      });
    } catch (error) {
      console.error(`Error storing ${key} in IndexedDB:`, error);
    }
  };
  
  // Delete a value from IndexedDB
  const deleteItem = async (key: string): Promise<void> => {
    try {
      const db = await openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        
        request.onsuccess = () => {
          resolve();
        };
        
        request.onerror = () => {
          reject(new Error(`Failed to delete item with key: ${key}`));
        };
      });
    } catch (error) {
      console.error(`Error deleting ${key} from IndexedDB:`, error);
    }
  };
  
  // Clear all values from IndexedDB
  const clear = async (): Promise<void> => {
    try {
      const db = await openDB();
      
      // Get all keys first
      const keys = await new Promise<string[]>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAllKeys();
        
        request.onsuccess = () => {
          resolve(request.result as string[]);
        };
        
        request.onerror = () => {
          reject(new Error('Failed to get keys'));
        };
      });
      
      // Delete only keys with our prefix
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      for (const key of keys) {
        if (typeof key === 'string' && key.startsWith('state:')) {
          store.delete(key);
        }
      }
      
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => {
          resolve();
        };
        
        transaction.onerror = () => {
          reject(new Error('Failed to clear data'));
        };
      });
    } catch (error) {
      console.error('Error clearing IndexedDB:', error);
    }
  };
  
  return {
    get,
    set,
    delete: deleteItem,
    clear
  };
};

/**
 * Factory function to create a storage adapter based on type
 */
export function createStorageAdapter(type: StorageAdapterType): StorageAdapter {
  switch (type) {
    case 'localStorage':
      return localStorageAdapter;
    case 'sessionStorage':
      return sessionStorageAdapter;
    case 'memory':
      return memoryStorageAdapter();
    case 'indexedDB':
      return indexedDBAdapter();
    default:
      console.warn(`Unknown storage adapter type: ${type}, falling back to memory`);
      return memoryStorageAdapter();
  }
}