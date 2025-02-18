// Inscription, login,...

import bcrypt from 'bcrypt';

export default async function authRoutes(fastify, options) {

    //Register
    fastify.post('/register', async (request, reply) => {
        const { username, email, password } = request.body;

        if (!username || !email || !password) {
            reply.code(400);
            return { error: 'Tous les champs sont requis' };
        }

        const userExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(email);
        if (userExists) {
            reply.code(400);
            return { error: 'Cet username est déjà utilisé.' };
        }

        const emailExists = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(email);
        if (emailExists) {
            reply.code(400);
            return { error: 'Cet email est déjà utilisé.' };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const stmt = fastify.db.prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        const result = stmt.run(username, email, hashedPassword);

        const userId = result.lastInsertRowid;
        
        reply.code(201);
        return { message: 'User registered successfully' };
    });

    //Login
    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.body;

        if (!email || !password) {
            reply.code(400);
            return { error: 'Email et mot de passe requis' };
        }

        return { message: 'User logged in successfully' };
    });
}

