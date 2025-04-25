import bcrypt from 'bcrypt';

import { XSSanitizer } from "../utils/sanitize.js";
import { queryGet, queryPost} from '../services/query.js'

async function registerRoutes(fastify) {

    fastify.post('/', async (request, reply) => {

        const { username, email, password } = XSSanitizer(request.body);
        if (!username || !email || !password) {
            reply.code(400);
            return { error: 'Tous les champs sont requis' };
        }
        
        let query = 'SELECT * FROM users WHERE username = ?';
        let params = username;
        const userExists = await queryGet(query, params);

        if (userExists !== undefined && userExists !== null) {
            console.log('Userexist exit\n');
            reply.code(400);
            return { error: 'Cet username est déjà utilisé.' };
        }

        query = "SELECT * FROM users WHERE email = ?";
        params = email;
        const emailExists = await queryGet(query, params);

        if (emailExists) {
            console.log('emailExist exit\n');
            reply.code(400);
            return { error: 'Cet email est déjà utilisé.' };
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        query = "INSERT INTO users (username, email, password, is_two_factor_enabled, status, google) VALUES (?, ?, ?, ?, ?, ?)";
        params = [username, email, hashedPassword, 0, 1, 0];
        await queryPost(query, params);
    
        query = "SELECT * FROM users WHERE username = ?";
        params = username;
        const user = await queryGet(query, params);

        const token = fastify.jwt.sign({
          id: user.id
        });

        reply.code(201);
        return { message: 'User registered successfully', token};
    });

}

export default registerRoutes;