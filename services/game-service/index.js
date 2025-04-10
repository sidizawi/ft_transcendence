import Fastify from 'fastify';
import websocket from '@fastify/websocket';
// import { WebSocketServer, WebSocket } from 'ws';
// import { fileURLToPath } from 'url';
// import path from 'path';
// import fastifyStatic from '@fastify/static';
// import Ball from './shared/Ball.js';
// import {createGame, addPlayer, updatePlayerPosition, handleDisconnect, startGame } from './pong/game.js';
// import Paddle from './public/Paddle.js';
// import { type } from 'os';
// import { startGame } from './pong/game.js';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });
fastify.register(websocket);

// Register static file serving
// fastify.register(fastifyStatic, {
//   root: path.join(__dirname, 'public'),
//   prefix: '/',
//   index: 'pong.html'
// });

// fastify.register(fastifyStatic, {
//   root: path.join(__dirname, 'shared'),
//   prefix: '/shared/',
//   decorateReply: false
// });

// let gameState = null;
// let gameLoop = null;
// let canvasDimensions = {
//   width: 800,
//   height: 600
// };

// const wss = new WebSocketServer({ port: 8080 });

// wss.on('connection', (ws) => {
//   console.log('Player connected');

//   ws.on('message', (message) => {
//     try {
//       const data = JSON.parse(message);
//       console.log('Received:', data);

//       if (data.type === 'dimensions') {
//         canvasDimensions = {
//           width: data.width,
//           height: data.height,
//           paddleWidth: data.paddleWidth,
//           paddleHeight: data.paddleHeight,
//           ballSize: data.ballSize
//         };
//       }
//       else if (data.type === 'startGame') {
//         console.log(`Starting new game in ${data.mode} mode`);
//         // Generate a unique game ID
//         const gameId = `game-${Date.now()}`;
//         // Create a new game with the client dimensions
//         createGame(gameId, wss, canvasDimensions);
//         // Generate a unique player ID
//         const playerId = `player-${Date.now()}`;
//         // Add the player to the game
//         const side = addPlayer(gameId, playerId, ws);
        
//         // Store game and player IDs with the connection
//         ws.gameId = gameId;
//         ws.playerId = playerId;
        
//         // Send confirmation to client
//         ws.send(JSON.stringify({
//           type: 'gameJoined',
//           gameId,
//           playerId,
//           side
//         }));
        
//         // Tell client game is started
//         ws.send(JSON.stringify({
//           type: 'gameStarted',
//           mode: data.mode
//         }));
//         // If single player, add AI opponent
//         if (data.mode === 'singlePlayer') {
//           // Add AI player
//           const aiPlayerId = `ai-${Date.now()}`;
//           addPlayer(gameId, aiPlayerId, null); // null ws for AI
//         }
//         if (data.mode === 'twoPlayer') {
//           const tempPlayerId = `player-${Date.now()}`;
//           addPlayer(gameId, tempPlayerId, null);
//         }
//         // Add multiplayer
//       }
//       else if (data.type === 'paddleMove') {
//         if (ws.gameId && ws.playerId) {
//           updatePlayerPosition(ws.gameId, ws.playerId, data);
//         }
//       }
//     } catch (error) {
//       console.error('Error parsing message', error);
//     }
//   });

//   // Handle disconnections
//   ws.on('close', () => {
//     console.log('Player disconnected');
//     if (ws.gameId && ws.playerId) {
//       handleDisconnect(ws.gameId, ws.playerId);
//     }
//   });
// });

// fastify.get('/status', async (request, reply) => {
//   return { message: "Game service is running!" };
// });

// // Add a route to serve your pong HTML
// fastify.get('/play', async (request, reply) => {
//   return reply.sendFile('pong.html');
// });

fastify.get('/ws/online', {websocket: true}, (conn, req) => {
  console.log('New client connected');

  conn.socket.on('message', msg => {
    console.log('Received:', msg.toString());
    conn.socket.send('Hello from server');
  });

  conn.socket.on('close', () => {
    console.log('Client disconnected');
  });
});

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🎮 Game Service running at ${address}`);
});
