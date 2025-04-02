// Inscription, login,...
import dotenv from 'dotenv';
dotenv.config();

import Fastify    from 'fastify';
import fastifyJwt from '@fastify/jwt';
import db         from './db.js';
import friendRoutes from './friend.js';

// const fastify = Fastify({ logger: false });
// fastify.addHook('onResponse', (request, reply, done) => {
//     console.log(`${request.method} ${request.url} ${reply.statusCode}`);
//     done();
// });
const fastify = Fastify({ logger: true });

await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });

fastify.decorate('db', db);

fastify.register(friendRoutes, { prefix: '/friend' });

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 Chat Service running at ${address}`);
});
