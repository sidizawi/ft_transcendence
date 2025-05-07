import { queryPost } from "./query.js";

export async function deleteConversationById(id) {
	const query = `DELETE FROM conversations WHERE user1_id = ? OR user2_id = ?`;
	const params = [id, id];
	await queryPost(query, params);
}