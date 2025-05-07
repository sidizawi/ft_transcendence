import { queryPost } from "./query.js";

export async function insertRequest(id, email, type, details, status){
    const query = `INSERT INTO gdpr_requests (user_id, email, request_type, details, status, created_at)
		VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`;
    const params = [id, email, type, details, status];
    await queryPost(query, params);
}