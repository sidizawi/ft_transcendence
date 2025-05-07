import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';

import db from './db.js';
import writeRoutes from './routes/write.js';
import readRoutes from './routes/read.js';
import transactionRoutes from './routes/transactions.js';

const fastify = Fastify({ logger: false });

fastify.addHook('onResponse', (request, reply, done) => {
	let rep = JSON.stringify(reply);
	console.log(`${request.method} ${request.url} ${reply.statusCode} ${rep}`);
	done();
});

// Activer CORS pour permettre les requêtes du frontend
fastify.register(fastifyCors, {
    origin: true, // Autorise toutes les origines (tu peux restreindre si besoin)
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
});

await fastify.register(fastifyJwt, {secret:process.env.JWT_SECRET});

fastify.decorate('db', db);

fastify.register(writeRoutes, { prefix: '/write'});
fastify.register(readRoutes, { prefix: '/read'});
fastify.register(transactionRoutes, { prefix: '/transaction'});

fastify.listen({ port: 2999, host: '0.0.0.0' }, (err, address) => {
    if (err) {
      fastify.log.error(err);
      process.exit(1);
    }
    console.log(`🚀 DB running at ${address}`);
});
  