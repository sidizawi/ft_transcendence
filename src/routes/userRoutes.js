// User management
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function userRoutes(fastify, options) {

    fastify.get('/profile', { preValidation: [fastify.authenticate] }, async (request, reply) => {

        const userId = request.user.id;
    
        const user = fastify.db
          .prepare("SELECT id, username, email, game_data FROM users WHERE id = ?")
          .get(userId);
    
        if (!user) {
          reply.code(404);
          return { error: 'Utilisateur non trouvé' };
        }

        return reply.view('profile.ejs', { user });
      })
}
