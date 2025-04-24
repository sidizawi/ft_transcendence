async function writeRoutes(fastify) {

    fastify.post('/', async (request, reply) => {
        const { query, params } = request.body;

        if (!query || !params){
            return reply.code(400).send({ error: 'Expected query and params'});
        }

        await request.jwtVerify();

        await fastify.db.prepare(query).run(...params);
        
        return reply.code(200);
    });
}

export default writeRoutes;