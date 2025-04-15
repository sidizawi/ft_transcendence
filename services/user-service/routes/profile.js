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
            is_two_factor_enabled: userExists.is_two_factor_enabled === 1 ? true : false,
            google: userExists.google === 1 ? true : false,
        }
       
console.log(userExists)

        return ({ message: 'Successfully retrieved profile'}, profile)
    });
}

export default profileRoutes;