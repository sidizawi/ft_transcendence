async function readRoutes(fastify){
    
    fastify.post('/get', async (request, reply) =>{
        const { query, params } = request.body;

        if (!query || !params){
            return reply.code(400).send({ error: 'Expected query and params'});
        }

        const result = await fastify.db.prepare(query).get(...params);

        return reply.code(200).send(result || null);
    });

    fastify.post('/all', async (request, reply) =>{
        const { query, params } = request.body;

        if (!query){
            return reply.code(400).send({ error: 'Expected query and params'});
        }

        const result = await fastify.db.prepare(query).all(...params);

        return reply.code(200).send(result || null);
    });
}

export default readRoutes;