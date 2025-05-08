import bcrypt from 'bcrypt';

import { googleClient } from "../index.js";
import { getUserByEmail,
  getCountAllUsers,
  insertUser
 } from '../services/userService.js';

async function googleRoutes(fastify) {

    fastify.post('/callback', async (request, reply) => {
        try {
          console.log('Google callback received');
          const { id_token } = request.body;
          if (!id_token) {
            reply.code(400);
            return { error: 'ID token not provided by Google' };
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
      
            await insertUser(name, email, hashedPassword, picture, "{}", 0, 1, 1);
            const lastInsertRowid = await getCountAllUsers();
            user = { id: lastInsertRowid, username: name, email };
          }
      
          const token = fastify.jwt.sign({
            id: user.id
        });
      
            reply.code(200);
            return { message: 'Google authentication successful', token };
        } 
        catch (error) 
        {
          fastify.log.error(error);
          reply.code(500).send({ error: "Error during Google authentication" });
        }
    });
    
}

export default googleRoutes;