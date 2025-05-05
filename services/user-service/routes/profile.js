import { getUserById, getUserByUsername, getAllUsersByUsername } from "../services/userService.js";

import bcrypt from 'bcrypt';

async function profileRoutes(fastify ,options) {
    fastify.get('/', async (request, reply) => {
        await request.jwtVerify();
	    const userId = request.user.id;
        
        const userExists = await getUserById(userId);
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
        
        reply.code(200);
        return ({ message: 'Successfully retrieved profile'}, profile)
    });

    fastify.get('/check-username/:username', async (request, reply) => {
        const { username } = request.params;

        const userExists = await getUserByUsername(username);
        if (!userExists){
            return reply.code(404).send({ error: 'Username doesnt exists'});
        }
        return reply.code(200).send({ message: 'Username exists'});
    });

    fastify.get('/check-password', async (request, reply) => {
        const { password } = request.body;
        if (!password){
            return reply.code(400).send({ error: 'Password is required'});
        }

        await request.jwtVerify();
	    const userId = request.user.id;

        const userExists = await getUserById(userId);
        if (!userExists){
            return reply.code(404).send({ error: 'User doesnt exist'});
        }

        const isPasswordValid = await bcrypt.compare(password, userExists.password);
        if (isPasswordValid){
            return reply.code(400).send({ error: 'Passwords must be different' });
        }
        return reply.code(200).send({ message: 'Passwords are different' });
    });

    fastify.get('/all-username', async (request, reply) => {

        const allUsers = await getAllUsersByUsername();
        if (!allUsers || allUsers.length === 0){
            return reply.code(404).send({ error: 'No users found'});
        }
        const usernames = allUsers.map(user => user.username);
        return reply.code(200).send({ usernames });
    });
}

export default profileRoutes;