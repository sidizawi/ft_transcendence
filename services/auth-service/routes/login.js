import bcrypt from 'bcrypt';

import { XSSanitizer } from "../utils/sanitize.js";
import { getUserByEmailAndUsername } from '../services/userService.js';

async function loginRoutes(fastify) {

    fastify.post('/', async (request, reply) => {
        const { login, password } = XSSanitizer(request.body);
        
        if (!login || !password) {
            reply.code(400);
            return { error: 'authService.error.loginAndPasswordIsRequired' };
        }
        
        const user = await getUserByEmailAndUsername(login);

        if (!user) {
            reply.code(401);
            return { error: 'authService.error.userNotFound' };
        }
        
        try  {
            await bcrypt.compare(password, user.password);
        }
        catch (error) {
            reply.code(401);
            return { error: 'authService.error.passwordInvalid' };
        } 
        
        const token = fastify.jwt.sign({
            id: user.id
        });
        
        reply.code(200);
        return { message: 'authService.message.loginSuccess', token };
    });
    
}

export default loginRoutes;