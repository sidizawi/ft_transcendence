import { queryGet, queryPost } from "./query.js";

export async function getCountGameByPlayerId(playerId) {
    const query = `SELECT COUNT(*) AS count FROM game WHERE playerid_1 = ? OR playerid_2 = ?`;
    const params = [playerId, playerId];
    const result = await queryGet(query, params);

    return result;
}

export async function insertGame(params) {
    const query = `INSERT INTO game 
        (playerid_1, playerid_2, username_1, username_2, game_type, score_1, score_2, player_win, player_lost) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    await queryPost(query, params);
}

