import dotenv 		from 'dotenv';
import Fastify    	from 'fastify';
import db         	from './db.js';
import fastifyJwt 	from '@fastify/jwt';
import fastifyCors 	from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import multipart from '@fastify/multipart';

import fastifyHelmet from '@fastify/helmet';;
import statsRoutes from './routes/stats.js';
import refreshRoutes from './routes/refresh.js';
import friendRoutes from './routes/friend.js';
import settingsRoutes from './routes/settings.js';
import profileRoutes from './routes/profile.js';
import gdprRoutes from './routes/gdpr.js';

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(fastifyHelmet, {
	contentSecurityPolicy: {
	  directives: {
		defaultSrc: ["'self'"],
		scriptSrc: ["'self'", "'unsafe-inline'"],
		styleSrc: ["'self'", "'unsafe-inline'"],
		imgSrc: ["'self'", "data:"],
		connectSrc: ["'self'", "wss:", "ws:"]
	  }
	},
	crossOriginEmbedderPolicy: false
  });

// Enregistrer le plugin pour gérer multipart/form-data
await fastify.register(multipart, {
limits: { fileSize: 5 * 1024 * 1024 } // optionnel, ici 5MB max
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await fastify.register(fastifyStatic, {
	root: path.join(__dirname, '../../uploads/avatars'),
	prefix: '/avatars/'					 // URL prefix (e.g., http://localhost:3000/avatars/)
});

await fastify.register(fastifyJwt, {secret:process.env.JWT_SECRET})

export const verificationCodes = {};

// Activer CORS pour permettre les requêtes du frontend
fastify.register(fastifyCors, {
  origin: true, // Autorise toutes les origines (tu peux restreindre si besoin)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});

fastify.register(settingsRoutes, { prefix: '/settings' });
fastify.register(statsRoutes, { prefix: '/stats' });
fastify.register(refreshRoutes, { prefix: '/refresh'});
fastify.register(friendRoutes, { prefix: '/friend'});
fastify.register(profileRoutes, { prefix: '/profile'});
fastify.register(gdprRoutes, { prefix: '/gdpr'});

/// SERVER ///
fastify.listen({ port: 3004, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 User Service running at ${address}`);
});