import dotenv 		from 'dotenv';
import Fastify    	from 'fastify';
import db         	from './db.js';
import fastifyJwt 	from '@fastify/jwt';
import fastifyCors 	from '@fastify/cors';
import profileRoutes from './routes/profile.js';
import statsRoutes from './routes/stats.js';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const fastify = Fastify({ logger: false });
fastify.addHook('onResponse', (request, reply, done) => {
	console.log(`${request.method} ${request.url} ${reply.statusCode}`);
	done();
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await fastify.register(fastifyJwt, {secret:process.env.JWT_SECRET})

// Activer CORS pour permettre les requêtes du frontend
fastify.register(fastifyCors, {
  origin: "http://localhost:8000", // Autorise toutes les origines (tu peux restreindre si besoin)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});

await fastify.register(fastifyStatic, {
	root: path.join(__dirname, '../../uploads/avatars'),
	prefix: '/avatars/'					 // URL prefix (e.g., http://localhost:3000/avatars/)
});


fastify.decorate('db', db);

fastify.register(profileRoutes, { prefix: '/profile' });
fastify.register(statsRoutes, { prefix: '/stats' });

/// SERVER ///
fastify.listen({ port: 3004, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 User Service running at ${address}`);
});