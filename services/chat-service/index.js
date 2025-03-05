// Inscription, login,...
import dotenv from 'dotenv';
dotenv.config();

import Fastify    from 'fastify';
import fastifyJwt from '@fastify/jwt';
import db         from './db.js';

const fastify = Fastify({ logger: false });
fastify.addHook('onResponse', (request, reply, done) => {
    console.log(`${request.method} ${request.url} ${reply.statusCode}`);
    done();
});

await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET })

fastify.decorate('db', db);

fastify.post('/add', async (request, reply) =>{
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
			// console.log(friendlist)
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
	}

	const actualUserlist = JSON.parse(actualUserRow.list);
	// console.log(friendlist)
	if (friendid in actualUserlist){
		reply.code(400);
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
		// console.log(friendlist)
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

//todo: accept friend request, remove friend, block friend

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 Chat Service running at ${address}`);
});
