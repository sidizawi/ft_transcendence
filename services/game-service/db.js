import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Choose appropriate path based on environment
let dbPath;
if (process.env.DB_PATH) {
  // Environment variable exists - check if it's a Docker path
  if (process.env.DB_PATH.startsWith('/app') && process.env.NODE_ENV !== 'production') {
    // We're in development but using a Docker path - create a local version
    const localDir = path.join(process.cwd(), 'data');
    dbPath = path.join(localDir, 'management.db');
    console.log(`Using local development database: ${dbPath}`);
  } else {
    // Use the environment path
    dbPath = process.env.DB_PATH;
  }
} else {
  // No environment variable - use default local path
  dbPath = path.join(process.cwd(), 'data', 'management.db');
}

// Create the directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

// Create the database
console.log(`Connecting to database at: ${dbPath}`);
const db = new Database(dbPath);

export default db;
