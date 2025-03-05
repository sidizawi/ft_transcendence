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

// todo: update friend list
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

	const friend = fastify.db.prepare("SELECT * FROM friend where id = ?").get(actualid);
	
	if (!friend) {
		const newObj = { [friendid]: 'sending' };
		db.prepare('INSERT INTO friend (id, list) VALUES (?, ?)').run(
		  actualid,
		  JSON.stringify(newObj)
		);
		reply.code(201);
		return { message: 'User successfully added'};
	}

	const friendlist = JSON.parse(friend.list);
	console.log(friendlist)
	if (friendid in friendlist){
		reply.code(400);
		return { error: 'Username already in friendlist'};
	}

	friendlist[friendid] = 'sending';
  
  	const update = db.prepare("UPDATE friend SET list = ? WHERE id = ?");
	update.run(JSON.stringify(friendlist), actualid);
  
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
