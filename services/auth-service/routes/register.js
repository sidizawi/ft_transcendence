import bcrypt from 'bcrypt';

import { XSSanitizer } from "../utils/sanitize.js";
import { getUserByUsername,
    getUserByEmail,
    insertUser
 } from '../services/userService.js';

async function registerRoutes(fastify) {

    fastify.post('/', async (request, reply) => {
        try {
            
            const { username, email, password } = XSSanitizer(request.body);
            if (!username || !email || !password) {
                reply.code(400);
                return { error: 'Tous les champs sont requis' };
            }
            
            const userExists = await getUserByUsername(username);
            if (userExists) {
                console.log('Userexist exit\n');
                reply.code(400);
                return { error: 'Cet username est déjà utilisé.' };
            }
    
            const emailExists = await getUserByEmail(email);
            if (emailExists) {
                console.log('emailExist exit\n');
                reply.code(400);
                return { error: 'Cet email est déjà utilisé.' };
            }
    
            const hashedPassword = await bcrypt.hash(password, 10);

            await insertUser(username, email, hashedPassword, '/img/default-avatar.jpg', "{}", 0, 1, 0);

            const user = await getUserByUsername(username);

            const token = fastify.jwt.sign({
              id: user.id
            });

            reply.code(201);
            return { message: 'User registered successfully', token};
        }catch (error) {
            console.error('Error in registration route:', error);
            return reply.code(500).send({ error: 'Internal server error' });
        }
    });

}

export default registerRoutes;