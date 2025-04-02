// Inscription, login,...
import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import fastifyIO from 'fastify-socket.io'; // Corrected import
import fastifyJwt from '@fastify/jwt';
import db from './db.js';
import friendRoutes from './routes/friend.js';
import messageRoutes from './routes/message.js';
import { setupSocketHandlers } from './socket/index.js';

const fastify = Fastify({ logger: false });
fastify.addHook('onResponse', (request, reply, done) => {
    console.log(`${request.method} ${request.url} ${reply.statusCode}`);
    done();
});

await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });
await fastify.register(fastifyIO, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

fastify.decorate('db', db);

// Initialize users online map
fastify.decorate('usersOnline', new Map());

// Register routes
fastify.register(friendRoutes, { prefix: '/friend' });
fastify.register(messageRoutes, { prefix: '/message' });

// Set up Socket.IO handlers
fastify.ready().then(() => {
    setupSocketHandlers(fastify);
    console.log('Socket.IO is ready');
});

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`💬 Chat Service running at ${address}`);
});
