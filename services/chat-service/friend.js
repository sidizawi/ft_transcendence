// friend.js
import dotenv from 'dotenv';
dotenv.config();

import Fastify    from 'fastify';
import db         from './db.js';

const fastify = Fastify({ logger: false });
fastify.addHook('onResponse', (request, reply, done) => {
	console.log(`${request.method} ${request.url} ${reply.statusCode}`);
	done();
});

fastify.decorate('db', db);

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
		
		if (sendingRow.status !== 'sending' || receivRow.status !== 'receiving'){
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

	fastify.get('/list', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;

		const userfriends = fastify.db.prepare(
			"SELECT * from friend where userid1 = ?")
			.all(userId);

		if (!userfriends){
			reply.code(400);
			return { error: `Failed to retrieve all friends where id=${userId}`};
		}

		const userids = userfriends.map(friend => friend.userid2);

		const placeholders = userids.map(() => '?').join(', ');
			
		const friendData = fastify.db.prepare(`
			SELECT username, status FROM users WHERE id IN (${placeholders})`)
			.all(...userids);

		return { message: 'Successfully retrieve friend list', friendData};
	});
}
  
export default friendRoutes;