import { queryPost } from "./query.js";

export async function updateFriendUsernameById(username, columnToUpdate, id) {
	const query = `UPDATE friend SET username1 = ? WHERE userid${columnToUpdate} = ?`;
	const params = [username, id];
	await queryPost(query, params);
}

export async function updateFriendUsernameByIdUsername(columnUser, username, columnId, id, username2) {
	const query = `UPDATE friend SET username${columnUser} = ? 
		WHERE userid${columnId} = ? 
		AND username${columnUser} = ?`;
	const params = [username, id, username2];
	await queryPost(query, params);
}

export async function deleteFriendById(id) {
	const query = `DELETE FROM friend WHERE userid1 = ? OR userid2 = ?`;
	const params = [id, id];
	await queryPost(query, params);
}

