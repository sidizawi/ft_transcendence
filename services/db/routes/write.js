async function writeRoutes(fastify) {

    fastify.post('/', async (request, reply) => {
        const { query, params } = request.body;

        if (!query || !params){
            return reply.code(400).send({ error: 'Expected query and params'});
        }

        await fastify.db.prepare(query).run(...params);
    });
}

export default writeRoutes;