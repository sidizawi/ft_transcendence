// Inscription, login,...

import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function authRoutes(fastify, options) {

    //Register
    fastify.get('/register', async (request, reply) => {
        try {
            const token = request.cookies && request.cookies.token;
            if (token) {
              const decoded = fastify.jwt.decode(token);
              console.log('Token décodé:', decoded);
              const currentTime = Math.floor(Date.now() / 1000);
              if (decoded && (!decoded.exp || decoded.exp > currentTime)) {
                return reply.redirect('/user/profile');
              } else {
                reply.clearCookie('token');
              }
            }
            const html = await fs.readFile(path.join(__dirname, '..', 'public', 'register.html'), 'utf8');
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
        
        reply.code(201);
        return { message: 'User registered successfully' };
    });

    //Login
    fastify.get('/login', async (request, reply) => {
        try {
          const token = request.cookies && request.cookies.token;
          if (token) {
            const decoded = fastify.jwt.decode(token);
            console.log('Token décodé:', decoded);
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded && (!decoded.exp || decoded.exp > currentTime)) {
              return reply.redirect('/user/profile');
            } else {
              reply.clearCookie('token');
            }
          }
          const html = await fs.readFile(path.join(__dirname, '..', 'public', 'login.html'), 'utf8');
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
            secure: process.env.NODE_ENV === 'production' ? true : false,
            sameSite: 'strict',
            path: '/'
        });

        reply.code(200);
        return { message: 'User logged in successfully', token };
    });
    
    //Logout
    fastify.get('/logout', async (request, reply) => {
        reply.clearCookie('token')
        reply.redirect('/home')
    });
}

