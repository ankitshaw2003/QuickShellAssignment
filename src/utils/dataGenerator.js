/**
 * Utility to generate 1 million customer records
 * Data is generated with realistic patterns for testing
 */

const firstNames = [
  'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
  'William', 'Barbara', 'David', 'Elizabeth', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'
];

const lastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
];

const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'company.com'];

const avatarColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

const generatePhone = () => {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 9000) + 1000;
  return `+1 (${areaCode}) ${prefix}-${lineNumber}`;
};

const generateDate = () => {
  const now = Date.now();
  const twoYearsAgo = now - (2 * 365 * 24 * 60 * 60 * 1000);
  const randomTime = twoYearsAgo + Math.random() * (now - twoYearsAgo);
  return new Date(randomTime).toISOString();
};

const generateAvatar = (firstName, lastName) => {
  const initials = `${firstName[0]}${lastName[0]}`;
  const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  return { initials, color };
};

export const generateCustomer = (id) => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${id}@${domains[Math.floor(Math.random() * domains.length)]}`;
  const phone = generatePhone();
  const score = Math.floor(Math.random() * 100) + 1;
  const lastMessageAt = generateDate();
  const addedBy = firstNames[Math.floor(Math.random() * firstNames.length)] + ' ' + lastNames[Math.floor(Math.random() * lastNames.length)];
  const avatar = generateAvatar(firstName, lastName);

  return {
    id,
    name,
    phone,
    email,
    score,
    lastMessageAt,
    addedBy,
    avatar
  };
};

/**
 * Check if IndexedDB is available
 */
export const isIndexedDBAvailable = () => {
  try {
    return 'indexedDB' in window && window.indexedDB !== null;
  } catch (e) {
    return false;
  }
};

/**
 * Initialize database with better error handling
 */
export const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    // Check if IndexedDB is available
    if (!isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is not available. Please use a regular browser window (not private/incognito mode).'));
      return;
    }

    try {
      const request = indexedDB.open('CustomersDB', 1);

      request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.error);
        reject(new Error(`IndexedDB error: ${event.target.error?.message || 'Unknown error'}`));
      };
      
      request.onsuccess = (event) => {
        const db = event.target.result;
        console.log('Database opened successfully');
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        try {
          const db = event.target.result;
          
          // Create object store if it doesn't exist
          if (!db.objectStoreNames.contains('customers')) {
            const objectStore = db.createObjectStore('customers', { keyPath: 'id' });
            
            // Create indexes for search optimization
            objectStore.createIndex('name', 'name', { unique: false });
            objectStore.createIndex('email', 'email', { unique: false });
            objectStore.createIndex('phone', 'phone', { unique: false });
            objectStore.createIndex('score', 'score', { unique: false });
            objectStore.createIndex('lastMessageAt', 'lastMessageAt', { unique: false });
            
            console.log('Object store created successfully');
          }
        } catch (error) {
          console.error('Error in onupgradeneeded:', error);
          reject(error);
        }
      };

      request.onblocked = () => {
        console.warn('Database opening blocked. Please close other tabs with this application.');
      };

    } catch (error) {
      console.error('Exception while opening IndexedDB:', error);
      reject(error);
    }
  });
};

/**
 * Populate database with customer records in batches with progressive loading
 * @param {IDBDatabase} db - The IndexedDB database instance
 * @param {Function} onProgress - Callback for progress updates (processed, total)
 * @param {Function} onBatchComplete - Callback when each batch is ready to display (customers array)
 */
export const populateDatabase = async (db, onProgress, onBatchComplete) => {
  const BATCH_SIZE = 5000; // Smaller batch size for faster initial display
  const TOTAL_RECORDS = 1000000;
  let processed = 0;

  try {
    for (let batch = 0; batch < TOTAL_RECORDS / BATCH_SIZE; batch++) {
      // Pre-generate the batch of customers before starting transaction
      const batchCustomers = [];
      for (let i = 0; i < BATCH_SIZE; i++) {
        const id = batch * BATCH_SIZE + i + 1;
        const customer = generateCustomer(id);
        batchCustomers.push(customer);
      }

      // Now write the batch to IndexedDB in a single transaction
      await new Promise((resolve, reject) => {
        const transaction = db.transaction(['customers'], 'readwrite');
        const objectStore = transaction.objectStore('customers');

        // Add all customers in this batch
        for (const customer of batchCustomers) {
          objectStore.add(customer);
        }

        transaction.oncomplete = () => {
          processed += BATCH_SIZE;
          if (onProgress) onProgress(processed, TOTAL_RECORDS);

          // Notify that this batch is ready to be displayed
          if (onBatchComplete) onBatchComplete(batchCustomers);

          resolve();
        };

        transaction.onerror = (event) => {
          console.error('Transaction error:', event.target.error);
          reject(new Error(`Transaction error: ${event.target.error?.message || 'Unknown error'}`));
        };

        transaction.onabort = (event) => {
          console.error('Transaction aborted:', event.target.error);
          reject(new Error('Transaction aborted'));
        };
      });

      // Yield to browser event loop after each batch to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  } catch (error) {
    console.error('Error populating database:', error);
    throw error;
  }
};

/**
 * Check if database is already populated
 */
export const isDatabasePopulated = async (db) => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['customers'], 'readonly');
      const objectStore = transaction.objectStore('customers');
      const countRequest = objectStore.count();

      countRequest.onsuccess = () => {
        const count = countRequest.result;
        console.log(`Database contains ${count} records`);
        resolve(count >= 1000000);
      };

      countRequest.onerror = (event) => {
        console.error('Count error:', event.target.error);
        reject(new Error(`Count error: ${event.target.error?.message || 'Unknown error'}`));
      };
    } catch (error) {
      console.error('Exception in isDatabasePopulated:', error);
      reject(error);
    }
  });
};

/**
 * Clear all data from the database
 */
export const clearDatabase = async (db) => {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(['customers'], 'readwrite');
      const objectStore = transaction.objectStore('customers');
      const clearRequest = objectStore.clear();

      clearRequest.onsuccess = () => {
        console.log('✅ Database cleared successfully');
        resolve();
      };

      clearRequest.onerror = (event) => {
        console.error('Clear error:', event.target.error);
        reject(new Error(`Clear error: ${event.target.error?.message || 'Unknown error'}`));
      };
    } catch (error) {
      console.error('Exception in clearDatabase:', error);
      reject(error);
    }
  });
};

/**
 * Generate customers in memory with progressive loading (fallback if IndexedDB fails)
 * @param {number} count - Total number of customers to generate
 * @param {Function} onProgress - Callback for progress updates (processed, total)
 * @param {Function} onBatchComplete - Callback when each batch is ready to display (customers array)
 * @returns {Promise<Array>} Promise that resolves with all customers when complete
 */
export const generateCustomersInMemory = async (count = 1000000, onProgress, onBatchComplete) => {
  const BATCH_SIZE = 5000; // Smaller batch size for faster initial display
  const allCustomers = [];

  for (let batchStart = 1; batchStart <= count; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, count);
    const batchCustomers = [];

    for (let i = batchStart; i <= batchEnd; i++) {
      batchCustomers.push(generateCustomer(i));
    }

    allCustomers.push(...batchCustomers);

    if (onProgress) {
      onProgress(batchEnd, count);
    }

    // Notify that this batch is ready to be displayed
    if (onBatchComplete) {
      onBatchComplete(batchCustomers);
    }

    // Yield to browser event loop after each batch to keep UI responsive
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return allCustomers;
};
