import { queryPost } from "./query.js";

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
