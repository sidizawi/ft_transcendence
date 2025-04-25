import Fastify    from 'fastify';
import fastifyCors from '@fastify/cors';
import db         from './db.js';
import fastifyJwt from '@fastify/jwt';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import nodemailer from 'nodemailer';
import fastifyHelmet from '@fastify/helmet';

import registerRoutes from './routes/register.js';
import loginRoutes from './routes/login.js';
import googleRoutes from './routes/google.js';
import twofaRoutes from './routes/2fa.js';

import { authenticate } from './plugin/auth.js';

dotenv.config();

export const googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

export const transporter = nodemailer.createTransport({
    service: 'Gmail',
    host: "smtp.gmail.com",
    secure: true,
    auth: {
      user: process.env.EMAIL_MAIL, 
      pass: process.env.EMAIL_APPPASS
    }
});

const fastify = Fastify({ logger: true });

// Activer CORS pour permettre les requêtes du frontend
await fastify.register(fastifyCors, {
  origin: true, // Autorise toutes les origines (tu peux restreindre si besoin)
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
});

await fastify.register(fastifyHelmet, {
  contentSecurityPolicy: {
    directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:"],
    connectSrc: ["'self'", "wss:", "ws:"]
    }
  },
  crossOriginEmbedderPolicy: false
  });

await fastify.register(fastifyJwt, {secret: process.env.JWT_SECRET, sign: {expiresIn: '1d'}});

await fastify.decorate('authenticate', authenticate);

fastify.register(registerRoutes, { prefix: '/register'});
fastify.register(loginRoutes, { prefix: '/login'});
fastify.register(googleRoutes, { prefix: '/google'})
fastify.register(twofaRoutes, { prefix: '/2fa'});

/// SERVER ///
fastify.listen({ port: 3001, host: '0.0.0.0' }, (err, address) => {
	if (err) {
	  fastify.log.error(err);
	  process.exit(1);
	}
	console.log(`🔑 Auth Service running at ${address}`);
});