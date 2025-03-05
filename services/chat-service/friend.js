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
	
		const actualUserRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(actualid);
		const friendRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(friendid);
	
		if (!actualUserRow) {
			const actualObj = { [friendid]: 'sending' };
			db.prepare('INSERT INTO friend (id, list) VALUES (?, ?)').run(
			  actualid,
			  JSON.stringify(actualObj)
			);
			if (!friendRow){
				const friendObj = { [actualid]: 'receiving' };
				db.prepare('INSERT INTO friend (id, list) VALUES (?, ?)').run(
					friendid,
					JSON.stringify(friendObj)
				);
			}
			else{
				const friendlist = JSON.parse(friendRow.list);
				if (friendid in friendlist){
					reply.code(400);
					if (actualUserlist[friendid] == 'blocked')
						return {error: 'Username is blocked'}
					else
						return { error: 'Username already in friendlist of actual user'};
				}
				friendlist[actualid] = 'receiving';
	  
				db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
					JSON.stringify(friendlist), 
					friendid);
			}
			reply.code(201);
			return { message: 'User successfully added'};
		}
	
		const actualUserlist = JSON.parse(actualUserRow.list);
		if (friendid in actualUserlist){
			reply.code(400);
			if (actualUserlist[friendid] == 'blocked')
				return {error: 'Username is blocked'}
			else
				return { error: 'Username already in friendlist of actual user'};
		}
	
		actualUserlist[friendid] = 'sending';
		
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(actualUserlist), 
			actualid);
		if (!friendRow){
			const friendObj = { [actualid]: 'receiving' };
			db.prepare('INSERT INTO friend (id, list) VALUES (?, ?)').run(
				friendid,
				JSON.stringify(friendObj)
			);
		}
		else{
			const friendlist = JSON.parse(friendRow.list);
			if (friendid in friendlist){
				reply.code(400);
				return { error: 'Username already in friendlist of friend'};
			}
			friendlist[actualid] = 'receiving';
	
				db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
				JSON.stringify(friendlist), 
				friendid);
		}
			
		reply.code(201);
		return { message: 'User successfully added'};
	});
	
	fastify.patch('/accept', async (request, reply) => {
		const { friendusername } = request.body;
		if (!friendusername){
			reply.code(400);
			return { error: 'Friendusername needed'};
		}
	
		await request.jwtVerify();
		const userid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
	
		const friendRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(friendid);
		const userRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(userid);
		
		const friendlist = JSON.parse(friendRow.list);
		const userlist = JSON.parse(userRow.list);
	
		if (friendlist[userid] !== 'receiving' || userlist[friendid] !== 'sending'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		friendlist[userid] = 'accepted';
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(friendlist), 
			friendid);
	
		userlist[friendid] = 'accepted';
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(userlist), 
			userid);
	
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
		const userid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
	
		const friendRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(friendid);
		const userRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(userid);
		
		const friendlist = JSON.parse(friendRow.list);
		const userlist = JSON.parse(userRow.list);
	
		if (friendlist[userid] !== 'receiving' || userlist[friendid] !== 'sending'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		delete friendlist[userid];
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(friendlist), 
			friendid);
	
		delete userlist[friendid];
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(userlist), 
			userid);
	
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
		const userid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
	
		const friendRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(friendid);
		const userRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(userid);
		
		const friendlist = JSON.parse(friendRow.list);
		const userlist = JSON.parse(userRow.list);
	
		if (friendlist[userid] !== 'accepted' || userlist[friendid] !== 'accepted'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		delete friendlist[userid];
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(friendlist), 
			friendid);
	
		delete userlist[friendid];
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(userlist), 
			userid);
	
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
		const userid = request.user.id;
	
		const friendExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(friendusername);
		const friendid = friendExists.id;
	
		const friendRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(friendid);
		const userRow = fastify.db.prepare("SELECT * FROM friend where id = ?").get(userid);
		
		const friendlist = JSON.parse(friendRow.list);
		const userlist = JSON.parse(userRow.list);
	
		if (friendlist[userid] !== 'accepted' || userlist[friendid] !== 'accepted'){
			reply.code(400);
			return { error: 'Wrong relationship between friends'};
		}
	
		friendlist[userid] = 'blocked';
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(friendlist), 
			friendid);
	
		userlist[friendid] = 'blocked';
		db.prepare("UPDATE friend SET list = ? WHERE id = ?").run(
			JSON.stringify(userlist), 
			userid);
	
		reply.code(201);
		return { error: 'Friend request successfully blocked'};
	});
  
}
  
export default friendRoutes;