import fastifyJwt from '@fastify/jwt';

async function refreshRoutes(fastify, options) {

	if (!fastify.jwt) {
		await fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });
	}
	fastify.get('/2fa/status', async (request, reply) => {
		await request.jwtVerify();
		const userId = request.user.id;
        
		const user = fastify.db.prepare('SELECT two_factor_enabled FROM users WHERE id = ?').get(userId);
		if (!user) {
			return reply.code(404).send({ error: 'User not found' });
		}

		reply.code(200).send({ twoFactorEnabled: user.two_factor_enabled });
	});
}

export default refreshRoutes;
