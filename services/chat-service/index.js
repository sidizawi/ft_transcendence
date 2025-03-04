// Inscription, login,...
import dotenv from 'dotenv';
dotenv.config();

import Fastify    from 'fastify';
import db         from './db.js';

const fastify = Fastify({ logger: false });
fastify.addHook('onResponse', (request, reply, done) => {
    console.log(`${request.method} ${request.url} ${reply.statusCode}${reply.message}`);
    done();
});

fastify.decorate('db', db);

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 Auth Service running at ${address}`);
});
