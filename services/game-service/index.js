import Fastify from 'fastify';
import { WebSocketServer } from 'ws';

const fastify = Fastify({ logger: true });

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  console.log('Player connected');
  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    ws.send(`Echo: ${message}`);
  });
});

fastify.get('/status', async (request, reply) => {
  return { message: "Game service is running!" };
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🎮 Game Service running at ${address}`);
});
