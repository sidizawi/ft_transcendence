// User management

export default async function userRoutes(fastify, options) {
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params;

        const user = fastify.db.prepare("SELECT id, username, email FROM users WHERE id = ?").get(id);

        if (!user) {
            reply.code(404);
            return { error: 'Utilisateur non trouvé' };
        }
        return reply.view('user.ejs', { user });
    });
}