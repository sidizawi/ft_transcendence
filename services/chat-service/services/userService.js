import { queryGet} from './query.js';

export async function getUserById(id) {

    const query = 'SELECT * FROM users WHERE id = ?';
	const params = id;
	const user = await queryGet(query, params);
    
    return user;
}

export async function getUserByUsername(username) {

    const query = 'SELECT * FROM users WHERE username = ?';
    const params = username;
    const user = await queryGet(query, params);
    
    return user;
}