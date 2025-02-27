import Fastify from 'fastify';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

fastify.get('*', async (request, reply) => {
	let url = __dirname + request.url
	const type = url.split('.')[[url.split('.').length - 1]];
	if (type == "html") {
		url =  __dirname + "/public" + request.url;
		console.log(url);
	}
	try {
		const file = await fs.readFile(url, 'utf-8');
		if (type == 'css') {
			reply.type('text/css').send(file);
		} else if (type == 'html') {
			reply.type('text/file').send(file);
		} else if (type == 'js') {
			reply.type('text/javascript').send(file);
		} else {
			reply.type('image/' + type).send(file);
		}
	} catch (error) {
		const html = await fs.readFile(path.join(__dirname, "public", "home.html"), 'utf-8');
		reply.type('text/html').send(html);
	}
});

fastify.listen({ port: 8000, host: '0.0.0.0'});
