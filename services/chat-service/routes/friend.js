// friend.js
import dotenv from 'dotenv';
dotenv.config();

async function friendRoutes(fastify, options) {

	fastify.post('/add', async (request, reply) => {
		const { username } = request.body;
		if (!username){
			reply.code(400);
			return { error: 'Username needed'};
		}
	
		await request.jwtVerify();
		const actualuser = request.user.username;
		const actualid = request.user.id;
	
		if (actualuser === username){
			reply.code(400)
			return { error: 'Cannot add yourself'}
		}
	
		const userExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
		if (!userExists) {
			reply.code(400);
			return { error: 'Username doesnt exist'};
		}
	
		const friendid = userExists.id;

		const actualUserRow = fastify.db.prepare("SELECT * FROM friend WHERE (userid1, userid2) = (?, ?)").get(actualid, friendid);
		const friendRow = fastify.db.prepare("SELECT * FROM friend WHERE (userid1, userid2) = (?, ?)").get(friendid, actualid);

		if (!actualUserRow && !friendRow){
			fastify.db.prepare("INSERT INTO friend (userid1, userid2, username1, username2, status) VALUES (?, ?, ?, ?, ?)").run(
				actualid,
				friendid,
				actualuser,
				username,
				'sending'
			);
			fastify.db.prepare("INSERT INTO friend (userid1, userid2, username1, username2, status) VALUES (?, ?, ?, ?, ?)").run(
				friendid,
				actualid,
				username,
				actualuser,
				'receiving'
			);
			reply.code(201);
			return { message: 'User successfully added'};
		}
		else{
			reply.code(500);
			return { error: 'Username already friendlist'};
		}

	});
	
	fastify.delete('/cancel', async (request, reply) => {
		const { friendusername } = request.body;
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
	
		const actualRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(actualid, friendid);
		const friendRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(friendid, actualid);
	
		if (actualRow.status !== 'sending' || friendRow.status !== 'receiving'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		fastify.db.prepare("DELETE FROM friend where (userid1, userid2)=(?, ?)").run(
			actualid,
			friendid
		);
		fastify.db.prepare("DELETE FROM friend where (userid1, userid2)=(?, ?)").run(
			friendid,
			actualid
		);
	
		reply.code(201);
		return { message: 'Friend request successfully cancelled'};
	});

	fastify.patch('/accept', async (request, reply) => {
		const { friendusername } = request.body;
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
		
		const sendingRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(actualid, friendid);
		const receivRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(friendid, actualid);

		if (sendingRow.status !== "sending" || receivRow.status !== "receiving"){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		fastify.db.prepare("UPDATE friend SET status='accepted' where (userid1, userid2)=(?, ?)").run(
			actualid,
			friendid
		);
		fastify.db.prepare("UPDATE friend SET status='accepted' where (userid1, userid2)=(?, ?)").run(
			friendid,
			actualid
		);

		reply.code(201);
		return { error: 'Friend request successfully accepted'};
	});
	
	fastify.patch('/reject', async (request, reply) => {
		const { friendusername } = request.body;
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
	
		const sendingRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(actualid, friendid);
		const receivRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(friendid, actualid);
	
		if (sendingRow.status !== 'sending' || receivRow.status !== 'receiving'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		fastify.db.prepare("DELETE FROM friend where (userid1, userid2)=(?, ?)").run(
			actualid,
			friendid
		);
		fastify.db.prepare("DELETE FROM friend where (userid1, userid2)=(?, ?)").run(
			friendid,
			actualid
		);
	
		reply.code(201);
		return { error: 'Friend request successfully rejected'};
	});
	
	fastify.delete('/delete', async (request, reply) => {
		const { friendusername } = request.body;
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
	
		const actualRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(actualid, friendid);
		const friendRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(friendid, actualid);
	
		if (actualRow.status !== 'accepted' || friendRow.status !== 'accepted'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		fastify.db.prepare("DELETE FROM friend where (userid1, userid2)=(?, ?)").run(
			actualid,
			friendid
		);
		fastify.db.prepare("DELETE FROM friend where (userid1, userid2)=(?, ?)").run(
			friendid,
			actualid
		);
	
		reply.code(201);
		return { error: 'Friend request successfully deleted'};
	});
	
	fastify.patch('/block', async (request, reply) => {
		const { friendusername } = request.body;
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
	
		fastify.db.prepare("UPDATE friend SET status='blocked' where (userid1, userid2)=(?, ?)").run(
			actualid,
			friendid
		);
		fastify.db.prepare("DELETE FROM friend where (userid1, userid2)=(?, ?)").run(
			friendid,
			actualid
		);
	
		reply.code(201);
		return { error: 'Friend request successfully blocked'};
	});

	fastify.patch('/unblock', async (request, reply) => {
		const { friendusername } = request.body;
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const actualid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);

		const friendid = friendExists.id;

		const actualRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(actualid, friendid);
		const blockedvRow = fastify.db.prepare("SELECT * FROM friend where (userid1, userid2) = (?, ?)").get(friendid, actualid);

		if (actualRow.status !== 'blocked' || blockedvRow){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}

		fastify.db.prepare(
			"DELETE FROM friend where (userid1, userid2)=(?, ?)")
			.run(actualid, friendid);

		reply.code(201);
		return { error: 'User successfully unblocked'};
	});

	fastify.get('/friendlist', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;

		const userfriends = fastify.db.prepare(
			"SELECT f.*, u.id, u.username, u.avatar FROM friend f JOIN users u ON f.userid2 = u.id WHERE f.userid1 = ? AND f.status = 'accepted'")
			.all(userId);

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

		const sendlist = fastify.db.prepare(`
			SELECT f.*, u.id, u.username, u.avatar 
			FROM friend f 
			JOIN users u ON f.userid2 = u.id 
			WHERE f.userid1 = ? AND f.status = 'sending'`)
			.all(userId);

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

		const requestlist = fastify.db.prepare(`
			SELECT f.*, u.id, u.username, u.avatar 
			FROM friend f 
			JOIN users u ON f.userid2 = u.id 
			WHERE f.userid1 = ? AND f.status = 'receiving'`)
			.all(userId);

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

		const blockedlist = fastify.db.prepare(`
			SELECT f.*, u.id, u.username, u.avatar 
			FROM friend f 
			JOIN users u ON f.userid2 = u.id 
			WHERE f.userid1 = ? AND f.status = 'blocked'`)
			.all(userId);

		const onlyUsername = blockedlist.map(item => ({
			username2: item.username,
			id: item.id,
			avatar: item.avatar || '/img/default-avatar.jpg',
		}));

		return { message: 'Successfully retrieve blocked list', onlyUsername };
	});
}
  
export default friendRoutes;