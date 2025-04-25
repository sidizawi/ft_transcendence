import bcrypt from 'bcrypt';

import { googleClient } from "../index.js";
import { queryGet } from '../services/query.js';

async function googleRoutes(fastify) {

    fastify.post('/callback', async (request, reply) => {
        try {
          console.log('Google callback received');
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
      
          const query = 'SELECT * FROM users WHERE email = ?';
          const params = email;
          let user = await queryGet(query, params);
          // let user = fastify.db.prepare("SELECT * FROM users WHERE email = ?").get(email);
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
    
}

export default googleRoutes;