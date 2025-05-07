import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DB_PATH || './management';
const db = new Database(dbPath);

export default db;
