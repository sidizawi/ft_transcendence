import bcrypt from 'bcrypt';

import { queryGet} from '../services/query.js'
import { XSSanitizer } from "../utils/sanitize.js";

async function loginRoutes(fastify) {

    fastify.post('/', async (request, reply) => {
        const { login, password } = XSSanitizer(request.body);
        
        if (!login || !password) {
            reply.code(400);
            return { error: 'Login (email ou username) et mot de passe requis' };
        }
        
        const query = 'SELECT * FROM users WHERE email = ? OR username = ?';
        const params = [login, login];
        const user = await queryGet(query, params);

        if (!user) {
            reply.code(401);
            return { error: 'Utilisateur non trouvé' };
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            reply.code(401);
            return { error: 'Mot de passe incorrect' };
        }
        
        const token = fastify.jwt.sign({
            id: user.id
        });
        
        reply.code(200);
        return { message: 'Utilisateur connecté avec succès', token };
    });
    
}

export default loginRoutes;