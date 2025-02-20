import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function homeRoutes(fastify, options) {
    
    fastify.get('/', async (request, reply) => {
        reply.redirect('/home');
    });

    fastify.get('/home', async (request, reply) => {
        try {
            const html = await fs.readFile(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
            reply.type('text/html').send(html);
        } catch (error) {
            reply.code(500).send('Internal error');
        }
    })
}