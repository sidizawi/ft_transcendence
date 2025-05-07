import { queryGet, queryPost } from "./query.js";
import { getUserById } from "./userService.js";

export async function getFriendShip(userId, friendId) {

    const query = 'SELECT * FROM friend WHERE (userid1, userid2) = (?, ?)';
    const params = [userId, friendId];
    const friendship = await queryGet(query, params);

    return friendship;
}

export async function getFriendShipStatus(userId, friendId) {

    const query = 'SELECT status FROM friend WHERE (userid1, userid2) = (?, ?)';
    const params = [userId, friendId];
    const friendship = await queryGet(query, params);

    return friendship;
}

export async function deleteFriendship(userId, friendId) {

    const query = 'DELETE FROM friend WHERE (userid1, userid2) = (?, ?)';
    const params = [userId, friendId];
    await queryPost(query, params);
}

export async function addFriendship(userId, friendId, status) {

    const query = 'INSERT INTO friend (userid1, userid2, username1, username2, status) VALUES (?, ?, ?, ?, ?)';

    let user = await getUserById(userId);
    const username = user.username;

    user = await getUserById(friendId);
    const friendUsername = user.username;

    const params = [userId, friendId, username, friendUsername, status];
    await queryPost(query, params);

}
