import { queryPost, queryAll, queryGet } from "./query.js";

export async function getMessageById(id) {
	const query = `SELECT * FROM messages WHERE sender_id = ? OR recipient_id = ?`;
	const params = [id, id];
	const result = await queryAll(query, params);

	return result;
}

export async function getCountMessageById(id) {
	const query = `SELECT COUNT(*) AS count FROM messages WHERE sender_id = ? OR recipient_id = ?`;
	const params = [id, id];
	const result = await queryGet(query, params);

	return result;
}

export async function deleteMessageById(id) {
	const query = `DELETE FROM messages WHERE sender_id = ? OR recipient_id = ?`;
	const params = [id, id];
	await queryPost(query, params);
}

export async function updateMessageById(newMessage, id) {
	const query = `UPDATE messages SET content = ? WHERE sender_id = ?`;
	const params = [newMessage, id];
	await queryPost(query, params);
}