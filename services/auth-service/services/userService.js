import { queryPost, queryGet } from "./query.js";

export async function getUserByUsername(username) {
    const query = `SELECT * FROM users WHERE username = ?`;
    const result = await queryGet(query, username);

    return result;
}

export async function getUserByEmail(email) {
    const query = `SELECT * FROM users WHERE email = ?`;
    const result = await queryGet(query, email);

    return result;
}

export async function getUserById(id) {
    const query = `SELECT * FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function getUserByEmailAndUsername(login) {
    const query = `SELECT * FROM users WHERE email = ? OR username = ?`;
    const params = [login, login];
    const result = await queryGet(query, params);

    return result;
}

export async function get2faById(id) {
    const query = `SELECT is_two_factor_enabled FROM users WHERE id = ?`;
    const result = await queryGet(query, id);

    return result;
}

export async function insertUser(username, email, hashedPassword, avatar, twofa, status, google) {
    const query = 'INSERT INTO users (username, email, password, avatar, is_two_factor_enabled, status, google) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const params = [username, email, hashedPassword, avatar, twofa, status, google];
    await queryPost(query, params);
}

export async function update2faById(twofa, id) {
    const query = 'UPDATE users SET is_two_factor_enabled = ? WHERE id = ?';
    const params = [twofa, id];
    await queryPost(query, params);
}
