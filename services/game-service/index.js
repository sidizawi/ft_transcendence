import dotenv from 'dotenv';
import Fastify from 'fastify';
import db from './db.js';
import websocket from '@fastify/websocket';
import { createGame, addPlayer, updatePlayerPosition, handleDisconnect, startGame } from './pong/game.js';
import { connect4Handler } from './connect4/handler.js'

dotenv.config();

const fastify = Fastify({logger: true})

// fastify.register(require('@fastify/jwt'), {
//   secret: process.env.JWT_SECRET });

// fastify.decorate('authenticate', async (request, reply) => {
//   try {
//     await request.jwtVerify();
//   } catch (err) {
//     reply.code(401).send({ error: 'Unauthorized' });
//   }
// });

fastify.decorate('db', db);

fastify.register(websocket);

let canvasDimensions;
export const waitingPlayers = [];
export const activePlayerIds = new Set();

// Helper function for creating games
function setupNewGame(ws, mode, opponent = null) {
  // Check if user is already in a game
  if (ws.userId && activePlayerIds.has(ws.userId)) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'You are already in a game'
    }));
    return null;
  }
  // Generate a unique game ID
  const gameId = `game-${Date.now()}`;
  // Create a new game with the client dimensions
  createGame(gameId, ws, canvasDimensions);
  
  // Generate a unique player ID if not already set
  if (!ws.playerId) {
    ws.playerId = `player-${Date.now()}`;
  }
  
  // Add the main player to the game
  const side = addPlayer(gameId, ws.playerId, ws);
  
  // Store game ID with the connection
  ws.gameId = gameId;
  
  console.log(`New game created: gameId=${gameId}, playerId=${ws.playerId}`);
  
  // Send confirmation to client
  ws.send(JSON.stringify({
    type: 'gameJoined',
    gameId,
    playerId: ws.playerId,
    side
  }));
  
  // Tell client game is started
  ws.send(JSON.stringify({
    type: 'gameStarted',
    mode
  }));
  
  // Handle different opponent types based on mode
  if (mode === 'singlePlayer') {
    // Add AI player
    const aiPlayerId = `ai-${Date.now()}`;
    addPlayer(gameId, aiPlayerId, null);
  } 
  else if (mode === 'twoPlayer') {
    // Add second local player
    const tempPlayerId = `player-${Date.now()}`;
    addPlayer(gameId, tempPlayerId, null);
  }
  else if (mode === 'online' && opponent) {
    // Add the opponent and notify them
    const oppSide = side === 'left' ? 'right' : 'left';
    addPlayer(gameId, opponent.playerId, opponent);
    opponent.gameId = gameId;
    
    opponent.send(JSON.stringify({
      type: 'gameJoined',
      gameId,
      playerId: opponent.playerId,
      side: oppSide
    }));
    
    opponent.send(JSON.stringify({
      type: 'gameStarted',
      mode: 'online'
    }));
  }
  
  // Start the game
  startGame(gameId);
  
  return gameId;
}

fastify.register(async function (wsRoutes) {
  wsRoutes.get('/ws/pong', { websocket: true }, (socket, req) => {
    console.log('Player connected');
    const { token } = req.query;
    const ws = socket;

    if (!token)  {
       socket.close();
    }
     ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);

        if (data.type === 'dimensions') {
          canvasDimensions = {
            width: data.width,
            height: data.height,
            paddleWidth: data.paddleWidth,
            paddleHeight: data.paddleHeight,
            ballSize: data.ballSize
          };
          ws.send(JSON.stringify({
            type: 'starting',
          }));
        }
        else if (data.type === 'startGame') {
          console.log(`Starting new game in ${data.mode} mode`);
          
          if (data.mode === 'online') {
            // For online mode, check waiting players first
            if (waitingPlayers.length > 0) {
              // Match with a waiting player
              const opponent = waitingPlayers.shift();
              console.log(`Matching with waiting player: ${opponent.playerId}`);
              
              // Create game with both players
              setupNewGame(ws, 'online', opponent);
            } else {
              // No waiting players, add to queue
              if (!ws.playerId) {
                ws.playerId = `player-${Date.now()}`;
              }
              waitingPlayers.push(ws);
              console.log(`Added to waiting queue. Players waiting: ${waitingPlayers.length}`);
              
              // Tell client they're waiting
              ws.send(JSON.stringify({
                type: 'waitingOpponent'
              }));
            }
          } else {
            // Single player or two player modes
            setupNewGame(ws, data.mode);
          }
        }
        else if (data.type === 'paddleMove') {
          if (ws.gameId && ws.playerId) {
            updatePlayerPosition(ws.gameId, ws.playerId, data);
          }
        }
      } catch (error) {
        console.error('Error parsing message', error);
      }
    });
    // Handle disconnections
    ws.on('close', () => {
      console.log('Player disconnected');
      if (ws.gameId && ws.playerId) {
        handleDisconnect(ws.gameId, ws.playerId);
      }
    });
  });
});

fastify.register(connect4Handler);

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🎮 Game Service running at ${address}`);
});
