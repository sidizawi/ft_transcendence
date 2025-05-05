import { queryAll, queryGet, queryPost } from "./query.js";

export async function getUserByUsername(username) {
    const query = `SELECT * FROM users WHERE username = ?`;
    const result = await queryGet(query, username);

    return result;
}

export async function getUserById(id) {
    const query = `SELECT * FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function getAllUsersByUsername() {
    const query = `SELECT username FROM users`;
    const result = await queryAll(query, []);

    return result;
}

export async function getAvatarById(id) {
    const query = `SELECT avatar FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function get2faStatusById(id) {
    const query = `SELECT two_factor_enabled FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function getUsernameById(id) {
    const query = `SELECT username FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function getIdByUsername(username) {
    const query = `SELECT id FROM users WHERE username = ?`;
    const result = await queryGet(query, username);

    return result;
}

export async function getIdUsernameEmailById(id) {
    const query = `SELECT id, username, email FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function getUsernameEmailById(id) {
    const query = `SELECT username, email FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function getIdByEmail(email) {
    const query = `SELECT id FROM users WHERE email = ?`;
    const result = await queryGet(query, email);

    return result;
}

export async function getIdUsernameEmailAvatarById(id) {
    const query = `SELECT id, username, email, avatar FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function updateUsernameById(username, id) {
    const query = `UPDATE users SET username = ? WHERE id = ?`;
    const params = [username, id];
    const result = await queryPost(query, params);

    return result;
}

export async function updateAvatarById(avatar, id) {
    const query = `UPDATE users SET avatar = ? WHERE id = ?`;
    const params = [avatar, id];
    await queryPost(query, params);;
}

export async function updateSomeById(updates, params) {
    const query = `UPDATE users SET ${updates} WHERE id = ?`;
    await queryPost(query, params);
}

export async function deleteUserById(id) {
    const query = `DELETE FROM users WHERE id = ?`;
    await queryPost(query, id);
}
