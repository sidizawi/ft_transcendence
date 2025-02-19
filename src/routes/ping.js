// Test route

export default async function pingRoutes(fastify, options) {
    fastify.get('/ping', async (request, reply) => {
        return { message: 'pong'};
    });
}