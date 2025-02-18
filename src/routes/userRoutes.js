// User management

export default async function userRoutes(fastify, options) {
    fastify.get('/:id', async (request, apply) => {
        const { id } = request.params;
    });
}