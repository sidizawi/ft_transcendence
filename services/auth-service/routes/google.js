import bcrypt from 'bcrypt';

import { googleClient } from "../index.js";
import { getUserByEmail,
  insertUser
 } from '../services/userService.js';

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
      
          let user = await getUserByEmail(email);

          if (!user) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
            await insertUser(name, email, hashedPassword, picture, 0, 1, 1);
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