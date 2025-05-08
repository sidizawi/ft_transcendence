import bcrypt from 'bcrypt';

import { XSSanitizer } from "../utils/sanitize.js";
import { getUserByUsername,
    getUserByEmail,
    insertUser
 } from '../services/userService.js';

async function registerRoutes(fastify) {

    fastify.post('/', async (request, reply) => {
        const { username, email, password } = XSSanitizer(request.body);
        if (!username || !email || !password) {
            reply.code(400);
            return { error: 'authService.error.fieldsAreRequired' };
        }
        
        const userExists = await getUserByUsername(username);
        if (userExists) {
            reply.code(400);
            return { error: 'authService.error.usernameMustBeUnique' };
        }

        const emailExists = await getUserByEmail(email);
        if (emailExists) {
            reply.code(400);
            return { error: 'authService.error.emailMustBeUnique' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await insertUser(username, email, hashedPassword, '/img/default-avatar.jpg', "{}", 0, 1, 0);

        const user = await getUserByUsername(username);

        const token = fastify.jwt.sign({
            id: user.id
        });

        reply.code(201);
        return { message: 'authService.message.registerSuccess', token};
    });

}

export default registerRoutes;