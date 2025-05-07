import { XSSanitizer } from '../utils/sanitize.js';
import { queryGet, queryAll, queryPost} from '../services/query.js';
import { getUserById, getUserByUsername } from '../services/userService.js';
import { getFriendShip, getFriendShipStatus, deleteFriendship, addFriendship } from '../services/friendService.js';

import dotenv from 'dotenv';
dotenv.config();


async function friendRoutes(fastify, options) {

	fastify.post('/add', async (request, reply) => {
		const { username } = XSSanitizer(request.body);
		if (!username){
			reply.code(400);
			return { error: 'Username needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;

		const actualUser = await getUserById(actualid);
		if (!actualUser) {
			reply.code(400);
			return { error: 'User not found'};
		}
		const actualuser = actualUser.username;

		if (actualuser === username){
			reply.code(400)
			return { error: 'Cannot add yourself'}
		}

		const userExists = await getUserByUsername(username);
		if (!userExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}

		const friendid = userExists.id;

		const actualUserRow = await getFriendShip(actualid, friendid);
		const friendRow = await getFriendShip(friendid, actualid);

		if (!actualUserRow && !friendRow){
			await addFriendship(actualid, friendid, 'sending');
			await addFriendship(friendid, actualid, 'receiving');

			reply.code(201);
			return { message: 'User successfully added'};
		} else if (!actualUserRow && friendRow) {
			reply.code(400);
			return { error: 'Unknown user'}; //when you're blocked, you cannot add this person
		}
		else{
			reply.code(500);
			return { error: 'Username already friendlist'};
		}

	});
	
	fastify.delete('/cancel', async (request, reply) => {
		const { friendusername } = XSSanitizer(request.body);
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = await getUserByUsername(friendusername);

		if (!friendExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}

		const friendid = friendExists.id;
	
		const sendingStatus = await getFriendShipStatus(actualid, friendid);
		const receivingStatus = await getFriendShipStatus(friendid, actualid);
	
		if (sendingStatus.status !== 'sending' || receivingStatus.status !== 'receiving'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		await deleteFriendship(actualid, friendid);
		await deleteFriendship(friendid, actualid);
	
		reply.code(201);
		return { message: 'Friend request successfully cancelled'};
	});

	fastify.patch('/accept', async (request, reply) => {
		const { friendusername } = XSSanitizer(request.body);
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = await getUserByUsername(friendusername);

		if (!friendExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}

		const friendid = friendExists.id;
		
		const receiving = await getFriendShipStatus(actualid, friendid);
		const sending = await getFriendShipStatus(friendid, actualid);

		if (sending.status !== 'sending' || receiving.status !== 'receiving'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		const queryUpdate = `UPDATE friend SET status ='accepted' WHERE (userid1, userid2) = (?, ?)`;
		const paramsUpdate = [actualid, friendid];
		await queryPost(queryUpdate, paramsUpdate);

		const paramsUpdate2 = [friendid, actualid];
		await queryPost(queryUpdate, paramsUpdate2);

		reply.code(201);
		return { message: 'Friend request successfully accepted'};
	});
	
	fastify.patch('/reject', async (request, reply) => {
		const { friendusername } = XSSanitizer(request.body);
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = await getUserByUsername(friendusername);

		if (!friendExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}

		const friendid = friendExists.id;

		const receivStatus = await getFriendShipStatus(actualid, friendid);
		const sendingStatus = await getFriendShipStatus(friendid, actualid);
	
		if (sendingStatus.status !== 'sending' || receivStatus.status !== 'receiving'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		await deleteFriendship(actualid, friendid);
		await deleteFriendship(friendid, actualid);
	
		reply.code(201);
		return { message: 'Friend request successfully rejected'};
	});
	
	fastify.delete('/delete', async (request, reply) => {
		const { friendusername } = XSSanitizer(request.body);
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = await getUserByUsername(friendusername);

		if (!friendExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}

		const friendid = friendExists.id;

		const actualUser = await getFriendShipStatus(actualid, friendid);
		const friendUser = await getFriendShipStatus(friendid, actualid);
	
		if (actualUser.status !== 'accepted' || friendUser.status !== 'accepted'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	

		await deleteFriendship(actualid, friendid);
		await deleteFriendship(friendid, actualid);
	
		reply.code(201);
		return { message: 'Friend request successfully deleted'};
	});
	
	fastify.patch('/block', async (request, reply) => {
		const { friendusername } = XSSanitizer(request.body);
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = await getUserByUsername(friendusername);

		if (!friendExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}

		const friendid = friendExists.id;
	
		const queryUpdate = `UPDATE friend SET status='blocked' where (userid1, userid2)=(?, ?)`;
		const paramsUpdate = [actualid, friendid];
		await queryPost(queryUpdate, paramsUpdate);

		await deleteFriendship(friendid, actualid);
	
		reply.code(201);
		return { message: 'Friend request successfully blocked'};
	});

	fastify.patch('/unblock', async (request, reply) => {
		const { friendusername } = XSSanitizer(request.body);
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;

		const friendExists = await getUserByUsername(friendusername);

		if (!friendExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}

		const friendid = friendExists.id;

		const actualRow = await getFriendShip(actualid, friendid);
		const blockedRow = await getFriendShip(friendid, actualid);

		if (actualRow.status !== 'blocked' || blockedRow){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}

		await deleteFriendship(actualid, friendid);

		reply.code(201);
		return { error: 'User successfully unblocked'};
	});

	fastify.get('/friendlist', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;

		const query = `
			SELECT f.*, u.id, u.username, u.avatar 
			FROM friend f 
			JOIN users u ON f.userid2 = u.id 
			WHERE f.userid1 = ? AND f.status = 'accepted'`;
		const params = userId;
		const userfriends = await queryAll(query, params);

		if (!userfriends || userfriends.length === 0){
			return { message: 'No friends found', friendData: [] };
		}
		
		const friendData = userfriends.map(friend => ({
			id: friend.id,
			username: friend.username,
			avatar: friend.avatar || '/img/default-avatar.jpg',
		}));

		return { message: 'Successfully retrieve friend list', friendData };
	});

	fastify.get('/sendinglist', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;

		const query = `
			SELECT f.*, u.id, u.username, u.avatar 
			FROM friend f 
			JOIN users u ON f.userid2 = u.id 
			WHERE f.userid1 = ? AND f.status = 'sending'`;
		const params = userId;
		const sendlist = await queryAll(query, params);

		const onlyUsername = sendlist.map(item => ({
			username2: item.username,
			id: item.id,
			avatar: item.avatar || '/img/default-avatar.jpg',
		}));

		return { message: 'Successfully retrieve request list', onlyUsername };
	});

	fastify.get('/receivinglist', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;

		const query = `
			SELECT f.*, u.id, u.username, u.avatar 
			FROM friend f 
			JOIN users u ON f.userid2 = u.id 
			WHERE f.userid1 = ? AND f.status = 'receiving'`;
		const params = userId;
		const requestlist = await queryAll(query, params);

		const onlyUsername = requestlist.map(item => ({
			username2: item.username,
			id: item.id,
			avatar: item.avatar || '/img/default-avatar.jpg',
		}));

		return { message: 'Successfully retrieve request list', onlyUsername };
	});

	fastify.get('/blockedlist', async (request, reply) => {
        await request.jwtVerify();
        const userId = request.user.id; 


		const query = `
            SELECT f.*, u.id, u.username, u.avatar
            FROM friend f
            JOIN users u ON f.userid2 = u.id
            WHERE f.userid1 = ? AND f.status = 'blocked'`;
        const params = userId;
		const blockedlist = await queryAll(query, params);
		
		const onlyUsername = blockedlist.map(item => ({
            username2: item.username,
            id: item.id,
            avatar: item.avatar || '/img/default-avatar.jpg',
        }));  
		
		return { message: 'Successfully retrieve blocked list', onlyUsername };
    });

	fastify.get('/check-blocked/:friendUsername', async (request, reply) => {
		const friendUsername = request.params.friendUsername;
		if (!friendUsername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}

		await request.jwtVerify();
		const userId = request.user.id;

		const friendExists = await getUserByUsername(friendUsername);

		if (!friendExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}

		const friendid = friendExists.id;

		const query = `
			SELECT f.*, u.id, u.username, u.avatar 
			FROM friend f 
			JOIN users u ON f.userid2 = u.id 
			WHERE f.userid1 = ? AND f.status = 'blocked'`;
		const params = friendid;
		const blockedlist = await queryAll(query, params);

		if (blockedlist.length > 0) {
			return { message: 'User is blocked', isBlocked: true };
		} else {
			return { message: 'User is not blocked', isBlocked: false };
		}
	});
}

export default friendRoutes;