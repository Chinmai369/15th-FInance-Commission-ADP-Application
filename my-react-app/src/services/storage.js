// IndexedDB Storage Service - Provides much larger storage capacity than localStorage
// IndexedDB can typically store 50% of available disk space, vs localStorage's ~5-10MB limit

const DB_NAME = 'ADPWorksDB';
const DB_VERSION = 1;
const STORE_NAME = 'forwardedSubmissions';

let db = null;

// Initialize IndexedDB
export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ IndexedDB: Failed to open database');
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('✅ IndexedDB: Database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      // Create object store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: false });
        objectStore.createIndex('id', 'id', { unique: true });
        objectStore.createIndex('status', 'status', { unique: false });
        console.log('✅ IndexedDB: Object store created');
      }
    };
  });
};

// Save data to IndexedDB
export const saveToIndexedDB = async (data) => {
  try {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      // Clear existing data first
      const clearRequest = store.clear();
      
      clearRequest.onsuccess = () => {
        // Save all items
        const savePromises = data.map(item => {
          return new Promise((resolveItem, rejectItem) => {
            const putRequest = store.put(item);
            putRequest.onsuccess = () => resolveItem();
            putRequest.onerror = () => rejectItem(putRequest.error);
          });
        });

        Promise.all(savePromises)
          .then(() => {
            console.log('✅ IndexedDB: Data saved successfully', data.length, 'items');
            resolve(true);
          })
          .catch(reject);
      };

      clearRequest.onerror = () => reject(clearRequest.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('❌ IndexedDB: Error saving data', error);
    throw error;
  }
};

// Load data from IndexedDB
export const loadFromIndexedDB = async () => {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const data = request.result;
        console.log('✅ IndexedDB: Data loaded successfully', data.length, 'items');
        resolve(data);
      };

      request.onerror = () => {
        console.error('❌ IndexedDB: Error loading data');
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('❌ IndexedDB: Error loading data', error);
    return [];
  }
};

// Get storage usage info
export const getStorageInfo = async () => {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota,
        usage: estimate.usage,
        usageDetails: estimate.usageDetails,
        available: estimate.quota - estimate.usage,
        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Storage: Error getting storage info', error);
    return null;
  }
};

// Clear all data from IndexedDB
export const clearIndexedDB = async () => {
  try {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('✅ IndexedDB: Data cleared successfully');
        resolve(true);
      };
      
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('❌ IndexedDB: Error clearing data', error);
    throw error;
  }
};

// Migrate data from localStorage to IndexedDB
export const migrateFromLocalStorage = async () => {
  try {
    const stored = localStorage.getItem('forwardedSubmissions');
    if (stored) {
      const data = JSON.parse(stored);
      await saveToIndexedDB(data);
      console.log('✅ Storage: Migrated', data.length, 'items from localStorage to IndexedDB');
      // Optionally clear localStorage after migration
      // localStorage.removeItem('forwardedSubmissions');
      return data;
    }
    return [];
  } catch (error) {
    console.error('❌ Storage: Error migrating from localStorage', error);
    return [];
  }
};

