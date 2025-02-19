// Inscription, login,...

import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function authRoutes(fastify, options) {

    fastify.get('/register', async (request, reply) => {
        try {
            const html = await fs.readFile(path.join(__dirname, '..', 'public', 'register.html'), 'utf8');
            reply.type('text/html').send(html);
        } catch (error) {
            reply.code(500).send('Erreur interne');
        }
    });

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

