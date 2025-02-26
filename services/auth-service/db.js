// import { createRequire } from 'module';
// const require = createRequire(import.meta.url);
// const Database = require('better-sqlite3');

// const db = new Database('data/management.db', { verbose: console.log });

// db.exec(`
//     CREATE TABLE IF NOT EXISTS users (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     username TEXT NOT NULL UNIQUE,
//     email TEXT NOT NULL UNIQUE,
//     password TEXT NOT NULL,
//     game_data TEXT DEFAULT '{}'
//     );
// `);

// export default db;

import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || './management';
const db = new Database(dbPath);

export default db;
