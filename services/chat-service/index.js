// Inscription, login,...
import dotenv from 'dotenv';
dotenv.config();

import Fastify    from 'fastify';
import db         from './db.js';

const fastify = Fastify({ logger: true });

fastify.decorate('db', db);

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 Auth Service running at ${address}`);
});
