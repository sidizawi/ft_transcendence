import { queryAll, queryGet } from "./query.js";

export async function getUserByUsername(username) {
    const query = `SELECT * FROM users WHERE username = ?`;
    const params = username;
    const result = await queryGet(query, params);

    return result;
}

export async function getUserById(id) {
    const query = `SELECT * FROM users WHERE id = ?`;
    const params = id;
    const result = await queryGet(query, params);

    return result;
}

export async function getAllUsersByUsername() {
    const query = `SELECT username FROM users`;
    const params = [];
    const result = await queryAll(query, params);

    return result;
}

export async function getAvatarById(id) {
    const query = `SELECT avatar FROM users WHERE id = ?`;
    const params = id;
    const result = await queryGet(query, params);

    return result;
}

export async function get2faStatusById(id) {
    const query = `SELECT two_factor_enabled FROM users WHERE id = ?`;
    const params = id;
    const result = await queryGet(query, params);

    return result;
}
