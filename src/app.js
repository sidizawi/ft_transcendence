// ESM
import dotenv from 'dotenv';
dotenv.config();

import Fastify    from 'fastify';
import cors       from '@fastify/cors';
import fastifyJwt from '@fastify/jwt';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

import fastifyStatic     from '@fastify/static';
import path              from 'path';
import { fileURLToPath } from 'url';

import pingRoutes from './routes/ping.js'
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import db         from './db.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({
    logger: true
})

fastify.decorate('db', db);

await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET })
fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.send(err);
    }
})

await fastify.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/'
});

await fastify.register(cors, {})
await fastify.register(pingRoutes)
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(userRoutes, { prefix: '/user' })

/**
 * Run the server!
 */
const start = async () => {
    try {
        await fastify.listen({ port: 3000, host: '0.0.0.0' })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()