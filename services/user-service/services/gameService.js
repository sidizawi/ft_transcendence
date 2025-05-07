import { queryPost, queryAll } from "./query.js";

export async function getGameByPlayerIdAndGameType(params) {
	const query = `SELECT * FROM game WHERE (playerid_1 = ? OR playerid_2 = ?) AND game_type = ?`;
	const result = await queryAll(query, params);

	return result;
}

export async function getGameByPlayerId(id) {
	const query = `SELECT * FROM game WHERE playerid_1 = ? OR playerid_2 = ?`;
	const params = [id, id];
	const result = await queryAll(query, params);

	return result;
}

export async function getCountGameByPlayerId(id) {
	const query = `SELECT COUNT(*) AS count FROM game WHERE playerid_1 = ? OR playerid_2 = ?`;
	const params = [id, id];
	const result = await queryPost(query, params);

	return result;
}

export async function updateUsernameByPlayerAndUsername(columnUser, newUsername, columnId, id, username) {
	const query = `UPDATE game SET username_${columnUser} = ? 
		WHERE playerid_${columnId} = ? 
		AND username_${columnUser} = ?`;
	const params = [newUsername, id, username];
	await queryPost(query, params);
}

export async function updatePlayerwinByPlayerwinAndPlayerid(columnVic, newUsername, username, id) {
	const query = `UPDATE game SET player_${columnVic} = ? 
		WHERE player_${columnVic} = ? 
		AND (playerid_1 = ? OR playerid_2 = ?)`;
	const params = [newUsername, username, id, id];
	await queryPost(query, params);
}

export async function deleteGameByPlayerId(id) {
	const query = `DELETE FROM game WHERE playerid_1 = ? OR playerid_2 = ?`;
	const params = [id, id];
	await queryPost(query, params);
}
