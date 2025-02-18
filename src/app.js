// ESM
import Fastify    from 'fastify'
import cors       from '@fastify/cors'
import Database   from 'better-sqlite3'
import pingRoutes from './routes/ping.js'
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import db         from './db.js';

const fastify = Fastify({
    logger: true
})

fastify.decorate('db', db);

await fastify.register(cors, {})
await fastify.register(pingRoutes)
await fastify.register(authRoutes, { prefix: '/auth' })
await fastify.register(userRoutes, { prefix: '/user' })

/**
 * Run the server!
 */
const start = async () => {
    try {
        await fastify.listen({ port: 3000 })
    } catch (err) {
        fastify.log.error(err)
        process.exit(1)
    }
}

start()