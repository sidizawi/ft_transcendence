import bcrypt from 'bcrypt';

import { XSSanitizer } from "../utils/sanitize.js";
import { getUserByEmailAndUsername } from '../services/userService.js';

async function loginRoutes(fastify) {

    fastify.post('/', async (request, reply) => {
        const { login, password } = XSSanitizer(request.body);
        
        if (!login || !password) {
            reply.code(400);
            return { error: 'Login (email or username) and password required' };
        }
        
        const user = await getUserByEmailAndUsername(login);

        if (!user) {
            reply.code(401);
            return { error: 'User not found' };
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            reply.code(401);
            return { error: 'Incorrect password' };
        }
        
        const token = fastify.jwt.sign({
            id: user.id
        });
        
        reply.code(200);
        return { message: 'User successfully logged in', token };
    });
    
}

export default loginRoutes;