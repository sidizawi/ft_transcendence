// Inscription, login,...

import Fastify    from 'fastify';
import fastifyCors from '@fastify/cors';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import db         from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Activer CORS pour permettre les requêtes du frontend
fastify.register(fastifyCors, {
  origin: "*", // Autorise toutes les origines (tu peux restreindre si besoin)
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
});

fastify.decorate('db', db);

fastify.get('/register', async (request, reply) => {
    try {
        if (request.cookies && request.cookies.token) {
            try {
                await request.jwtVerify({ cookie: 'token' });
                return reply.redirect('/user/profile');
            } catch (err) {}
        }
        const html = await fs.readFile(path.join(__dirname, 'front', 'public', 'signUp.html'), 'utf8');
        reply.type('text/html').send(html);
    } catch (error) {
        reply.code(500).send('Internal error');
    }
});

fastify.post('/register', async (request, reply) => {
    const { username, email, password } = request.body;
    if (!username || !email || !password) {
        reply.code(400);
        return { error: 'Tous les champs sont requis' };
    }
    const userExists = fastify.db.prepare("SELECT * FROM users WHERE username = ?").get(username);
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
    const initialGameData = {
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        total_points: 0
    };

    const stmt = fastify.db.prepare("INSERT INTO users (username, email, password, game_data) VALUES (?, ?, ?, ?)");
    const result = stmt.run(username, email, hashedPassword, JSON.stringify(initialGameData));
    const userId = result.lastInsertRowid;

    // todo: create a token and send it
    reply.code(201);
    return { message: 'User registered successfully' };
});

//Login
fastify.get('/login', async (request, reply) => {
    try {
        if (request.cookies && request.cookies.token) {
            try {
                await request.jwtVerify({ cookie: 'token' });
                return reply.redirect('/user/profile');
            } catch (err) {}
        }
        const html = await fs.readFile(path.join(__dirname, 'front', 'public', 'signIn.html'), 'utf8');
        reply.type('text/html').send(html);
    } catch (error) {
        reply.code(500).send('Internal error');
    }
});

fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
        reply.code(400);
        return { error: 'Email et mot de passe requis' };
    }

    // todo: check with the username
    const user = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(email);
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
        id: user.id,
        username: user.username,
        email: user.email
    });

    reply.setCookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/'
    });

    reply.code(200);
    return { message: 'User logged in successfully', token };
});

//Logout
fastify.get('/logout', async (request, reply) => {
    reply.clearCookie('token')
    reply.redirect('/')
    reply.redirect('/home')
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 Auth Service running at ${address}`);
});
