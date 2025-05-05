import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors'; // Import the CORS plugin
import friendRoutes from './routes/friend.js';
import messageRoutes from './routes/message.js';

const fastify = Fastify({ logger: true });

await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });

fastify.register(websocket);

await fastify.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    websocket: true
});

fastify.decorate('usersOnline', new Map());
fastify.register(friendRoutes, { prefix: '/friend' });
fastify.register(messageRoutes, { prefix: '/message' });

fastify.listen({ port: 3003, host: '0.0.0.0' }, (err, address) => {
    if (err) {
        fastify.log.error(err);
        process.exit(1);
    }
    console.log(`💬 Chat Service running at ${address}`);
});
