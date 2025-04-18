import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH || './management';
const db = new Database(dbPath);

export function createAndUpdateGameRecord(player1Id, player2Id, username1, username2, score1, score2, winnerName, loserName) {
  try {
    const stmt = db.prepare(`
      INSERT INTO game 
      (playerid_1, playerid_2, username_1, username_2, game_type, score_1, score_2, player_win, player_lost)
      VALUES (?, ?, ?, ?, 'finished', ?, ?, ?, ?)
    `);
    
    const info = stmt.run(player1Id, player2Id || 0, username1, username2, score1, score2, winnerName, loserName);
    return info.lastInsertRowid;
  } catch (error) {
    console.error('Error saving game record:', error);
    return null;
  }
}

export default db;
