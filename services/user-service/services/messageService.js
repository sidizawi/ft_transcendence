import { queryPost } from "./query.js";

export async function deleteMessageById(id) {
	const query = `DELETE FROM messages WHERE sender_id = ? OR recipient_id = ?`;
	const params = [id, id];
	await queryPost(query, params);
}