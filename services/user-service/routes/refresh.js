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


  fastify.get('/avatars', async (request, reply) => {
    await request.jwtVerify();
    const userId = request.user.id;

    const user = fastify.db.prepare('SELECT avatar FROM users WHERE id = ?').get(userId);
    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // If the user doesn't have an avatar set, you can return a default value if desired.
    reply.code(200).send({ avatar: user.avatar || null });
  });
}

export default refreshRoutes;
