import Fastify from 'fastify';
import fastifyHttpProxy from '@fastify/http-proxy';
import fastifyCors from '@fastify/cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: false });
fastify.addHook('onResponse', (request, reply, done) => {
	let rep = JSON.stringify(reply);
	console.log(`${request.method} ${request.url} ${reply.statusCode} ${rep}`);
	done();
});

// Activer CORS pour permettre les requêtes du frontend
fastify.register(fastifyCors, {
  origin: "http://localhost:8000", // Autorise toutes les origines (tu peux restreindre si besoin)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});

// Proxy vers auth-service
fastify.register(fastifyHttpProxy, {
  upstream: 'http://auth-service:3001',
  prefix: '/auth'
});

// Proxy vers game-service
fastify.register(fastifyHttpProxy, {
  upstream: 'http://game-service:3002',
  prefix: '/game'
});

fastify.register(fastifyHttpProxy, {
	upstream: 'http://chat-service:3003',
	prefix: '/chat'
});

fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
  if (err) {
	fastify.log.error(err);
	process.exit(1);
  }
  console.log(`🚀 API Gateway running at ${address}`);
});
