async function readRoutes(fastify){
    
    fastify.post('/get', async (request, reply) =>{
        const { query, params } = request.body;
        
                console.log(query);
                console.log(params);

        if (!query || !params){
            return reply.code(400).send({ error: 'Expected query and params'});
        }

        await request.jwtVerify();

        const result = await fastify.db.prepare(query).get(params);

        if (!result){
            return reply.code(404).send({ error: 'Not found'});
        }

        return reply.code(200).send({ result });
    });

    fastify.post('/all', async (request, reply) =>{
        const { query, params } = request.body;

        if (!query){
            return reply.code(400).send({ error: 'Expected query and params'});
        }

        await request.jwtVerify();

        const result = await fastify.db.prepare(query).all(...params);

        if (!result){
            return reply.code(404).send({ error: 'Not found'});
        }

        return reply.code(200).send({ result });
    });
}

export default readRoutes;