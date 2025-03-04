import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

fastify.get('*', async (request, reply) => {
	let url = __dirname + request.url
	console.log("url =", request.url, 'path', url);
	const type = url.split('.')[[url.split('.').length - 1]];
	try {
		if (type == 'html') {
			throw new Error("only index.html file");
		}
		const file = await fs.readFile(url);
		if (type == 'css') {
			reply.type('text/css').send(file.toString('utf-8'));
		} else if (type == 'js') {
			reply.type('text/javascript').send(file.toString('utf-8'));
		} else if (type == 'ico') {
			reply.type('image/x-icon').send(file);
		} else {
			reply.type('image/' + type).send(file);
		}
	} catch (error) {
		const html = await fs.readFile(path.join(__dirname, "index.html"), 'utf-8');
		reply.type('text/html').send(html);
	}
});

fastify.listen({ port: 8000, host: '0.0.0.0'});
