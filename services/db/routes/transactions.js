async function transactionRoutes(fastify, options) {

    fastify.post('/begin', async (request, reply) => {
        try {
            fastify.db.prepare('BEGIN TRANSACTION').run();
            return reply.code(200).send({ success: true, message: 'Transaction started' });
        } catch (error) {
            return reply.code(500).send({ error: 'Failed to start transaction', details: error.message });
        }
    });

    fastify.post('/commit', async (request, reply) => {
        try {
            fastify.db.prepare('COMMIT').run();
            return reply.code(200).send({ success: true, message: 'Transaction committed' });
        } catch (error) {
            return reply.code(500).send({ error: 'Failed to commit transaction', details: error.message });
        }
    });
    
    fastify.post('/rollback', async (request, reply) => {
        try {
            fastify.db.prepare('ROLLBACK').run();
            return reply.code(200).send({ success: true, message: 'Transaction rolled back' });
        } catch (error) {
            return reply.code(500).send({ error: 'Failed to rollback transaction', details: error.message });
        }
    });
}

export default transactionRoutes;