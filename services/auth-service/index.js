// Inscription, login,...

import Fastify    from 'fastify';
import fastifyCors from '@fastify/cors';
import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import db         from './db.js';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const otpCache = {};

dotenv.config();

const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: "smtp.gmail.com",
    secure: true,
    auth: {
      user: process.env.EMAIL_MAIL, 
      pass: process.env.EMAIL_APPPASS
    }
});

// const fastify = Fastify({ logger: false });
// fastify.addHook('onResponse', (request, reply, done) => {
//     console.log(`${request.method} ${request.url} ${reply.statusCode}`);
//     done();
// });
const fastify = Fastify({ logger: true });

await fastify.register(fastifyJwt, {secret: process.env.JWT_SECRET, sign: {expiresIn: '1d'}});

// Activer CORS pour permettre les requêtes du frontend
fastify.register(fastifyCors, {
  origin: true, // Autorise toutes les origines (tu peux restreindre si besoin)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});

fastify.decorate('db', db);

fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Non autorisé' });
    }
});

/// AUTHENTIFICATION ///
//Register
fastify.get('/register', async (request, reply) => {
    try {
        if (request.cookies && request.cookies.token) {
            try {
                await request.jwtVerify({ cookie: 'token' });
                return reply.redirect('/user/profile');
            } catch (err) {}
        }
        const html = await fs.readFile(path.join(__dirname, 'front', 'public', 'register.html'), 'utf8');
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
    const stmt = fastify.db.prepare("INSERT INTO users (username, email, password, game_data,is_two_factor_enabled) VALUES (?, ?, ?, ?, ?)");
    const result = stmt.run(username, email, hashedPassword, JSON.stringify(initialGameData), 0);
    const userId = result.lastInsertRowid;

    const user = fastify.db.prepare(
      "SELECT * FROM users WHERE username = ?"
    ).get(username);

    const token = fastify.jwt.sign({
      id: user.id
    });

    reply.code(201);
    return { message: 'User registered successfully', token};
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
        const html = await fs.readFile(path.join(__dirname, 'front', 'public', 'login.html'), 'utf8');
        reply.type('text/html').send(html);
    } catch (error) {
        reply.code(500).send('Internal error');
    }
});

fastify.post('/login', async (request, reply) => {
    const { login, password } = request.body;
    
    if (!login || !password) {
        reply.code(400);
        return { error: 'Login (email ou username) et mot de passe requis' };
    }
    
    // Rechercher l'utilisateur par email ou username
    const user = fastify.db.prepare(
        "SELECT * FROM users WHERE email = ? OR username = ?"
    ).get(login, login);
    
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


/// AUTHENTIFICATION GOOGLE ///

fastify.post('/google/callback', async (request, reply) => {
  try {
    const { id_token } = request.body;
    if (!id_token) {
      reply.code(400);
      return { error: 'id_token non fourni par Google' };
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    let user = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const initialGameData = {
        games_played: 0,
        games_won: 0,
        games_lost: 0,
        total_points: 0
      };

      const stmt = fastify.db.prepare("INSERT INTO users (username, email, password, game_data, is_two_factor_enabled, avatar, google) VALUES (?, ?, ?, ?, ?, ?, ?)");
      const result = stmt.run(name, email, hashedPassword, JSON.stringify(initialGameData), 0, picture, 1);
      user = { id: result.lastInsertRowid, username: name, email };
    }

    const token = fastify.jwt.sign({
      id: user.id
  });

      reply.code(200);
      return { message: 'Authentification Google réussie', token };
  } 
  catch (error) 
  {
    fastify.log.error(error);
    reply.code(500).send({ error: "Erreur lors de l'authentification Google" });
  }
});

 /// 2FA ///
fastify.post('/2fa/email/send', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  try {
      await request.jwtVerify();
      const userId = request.user.id;

      const user = fastify.db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
      if (!user) {
          reply.code(404);
          return { error: 'Utilisateur non trouvé' };
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      otpCache[userId] = {
          otp,
          expires: Date.now() + 10 * 60 * 1000
      };
      console.log(user.mail);
      const mailOptions = {
          from: `"Transcendence" <${process.env.EMAIL_MAIL}>`,
          to: user.email,
          subject: 'Votre code de vérification 2FA',
          text: `Bonjour ${user.username},\n\nVotre code de vérification est : ${otp}\nIl expirera dans 10 minutes.\n\nCordialement,\nL'équipe Transcendence`
      };

      await transporter.sendMail(mailOptions);
      reply.code(200);
      return { message: 'OTP envoyé par email' };
  } catch (err) {
      fastify.log.error(err);
      reply.code(500);
      return { error: 'Erreur lors de l\'envoi de l\'email' };
  }
});

fastify.post('/2fa/connection/verify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
  try {
    const { otp } = request.body;
    if (!otp) {
      reply.code(400);
      return { error: 'Le code OTP est requis.' };
    }
    const userId = request.user.id;
    const entry = otpCache[userId];
    if (!entry || Date.now() > entry.expires) {
      reply.code(400);
      return { error: 'Le code OTP a expiré ou n\'existe pas.' };
    }
    if (entry.otp !== otp) {
      reply.code(403);
      return { error: 'Le code OTP est incorrect.' };
    }
    
    fastify.db.prepare("UPDATE users SET is_two_factor_enabled = 1 WHERE id = ?").run(userId);
    delete otpCache[userId];
    reply.code(200);
    return { message: '2FA activé avec succès.' };
  } catch (err) {
    fastify.log.error(err);
    reply.code(500);
    return { error: 'Erreur lors de la vérification du code OTP.' };
  }
});

/// 2FA Switch ///
fastify.post('/2fa/switch/verify', { preValidation: [fastify.authenticate] }, async (request, reply) => {
try {
  const { otp } = request.body;
  if (!otp) {
    reply.code(400);
    return { error: 'Le code OTP est requis.' };
  }

  const userId = request.user.id;
  const entry = otpCache[userId];
  if (!entry || Date.now() > entry.expires) {
    reply.code(400);
    return { error: 'Le code OTP a expiré ou n\'existe pas.' };
  }
  if (entry.otp !== otp) {
    reply.code(403);
    return { error: 'Le code OTP est incorrect.' };
  }
  const user = fastify.db.prepare("SELECT is_two_factor_enabled FROM users WHERE id = ?").get(userId);
  if (!user) {
    reply.code(404);
    return { error: 'Utilisateur non trouvé' };
  }

  const currentTwoFactorState = user.is_two_factor_enabled;
  const newTwoFactorState = currentTwoFactorState === 1 ? 0 : 1;
  fastify.db.prepare("UPDATE users SET is_two_factor_enabled = ? WHERE id = ?").run(newTwoFactorState, userId);
  delete otpCache[userId];
  const message = newTwoFactorState ? '2FA activé avec succès.' : '2FA désactivé avec succès.';
  reply.code(200);
  return { message };
} catch (err) {
  fastify.log.error(err);
  reply.code(500);
  return { error: 'Erreur lors de la vérification du code OTP.' };
}
});

  /// SERVER ///
fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 Auth Service running at ${address}`);
});