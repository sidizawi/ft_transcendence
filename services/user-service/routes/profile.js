async function profileRoutes(fastify ,options) {
    fastify.get('/', async (request, reply) => {
        await request.jwtVerify();
	    const userId = request.user.id;

        const userExists = fastify.db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
        if (!userExists){
            return reply.code(400).send({ error: 'User doesnt exist'});
        }

        const profile = {
            username: userExists.username,
            email: userExists.email,
            avatar: userExists.avatar ? userExists.avatar : null,
            '2fa': userExists.is_two_factor_enabled === 1 ? true : false 
        }
       
        return ({ message: 'Successfully retrieved profile'}, profile)
    });

    fastify.get('/check-username/:username', async (request, reply) => {
        const { username } = request.params;

        const userExists = fastify.db.prepare('SELECT * FROM users WHERE username = ?').get(username);
        if (!userExists){
            return reply.code(404).send({ error: 'Username doesnt exists'});
        }
        return reply.code(200).send({ message: 'Username exists'});
    });

    fastify.get('/all-username', async (request, reply) => {
        const allUsers = fastify.db.prepare('SELECT username FROM users').all();
        if (!allUsers){
            return reply.code(404).send({ error: 'No users found'});
        }
        const usernames = allUsers.map(user => user.username);
        return reply.code(200).send({ usernames });
    });
}

export default profileRoutes;