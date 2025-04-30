import db from './db.js';
import dotenv from 'dotenv';
import Fastify from 'fastify';
import fastifyJwt 	from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { connect4Handler } from './connect4/handler.js'
import { tournamentHandler } from './tournament/handler.js';
import { createGame, addPlayer, updatePlayerPosition, handleDisconnect, startGame } from './pong/game.js';

dotenv.config();

const fastify = Fastify({logger: true})

fastify.decorate('db', db);

await fastify.register(websocket);

fastify.register(fastifyJwt, {secret:process.env.JWT_SECRET})

export const waitingPlayers = [];
export const inGameUsers = new Set();

//let sockets = new Map();

// Helper function for creating games
function setupNewGame(ws, mode, opponent = null) {
  // Check if user is already in a game
  if (ws.username && inGameUsers.has(ws.username)) {
    return ws.send(JSON.stringify({
      type: 'error',
      message: 'You are already in a game'
    }));
  }
  inGameUsers.add(ws.username);
  // Generate a unique game ID
  const gameId = `game-${Date.now()}`;
  // Create a new game with the client dimensions
  createGame(gameId, ws, ws.canvasDimensions);
  
  // Add the main player to the game
  const side = addPlayer(gameId, ws.username, ws);
  
  // Store game ID with the connection
  ws.gameId = gameId;
  
  console.log(`New game created: gameId=${gameId}, username=${ws.username}`);
  
  // Send confirmation to client
  ws.send(JSON.stringify({
    type: 'gameJoined',
    gameId,
    username: ws.username,
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
    const aiUsername = `ai-${Date.now()}`;
    addPlayer(gameId, aiUsername, null);
  } 
  else if (mode === 'twoPlayer') {
    // Add second local player
    const tempusername = `player-${Date.now()}`;
    addPlayer(gameId, tempusername, null);
  }
  else if (mode === 'online' && opponent) {
    // Add the opponent and notify them
    const oppSide = side === 'left' ? 'right' : 'left';
    addPlayer(gameId, opponent.username, opponent);
    opponent.gameId = gameId;
    inGameUsers.add(opponent.username);
    opponent.send(JSON.stringify({
      type: 'gameJoined',
      gameId,
      username: opponent.username,
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

fastify.register((wsRoutes) => {
  wsRoutes.get('/ws/pong', { websocket: true }, (ws, req) => {
    console.log('Player connected');
    const { token } = req.query;

    if (!token)  {
       ws.close();
       return ;
    }

		fastify.jwt.verify(token);

     ws.on('message', (message) => {
      //if (!(ws in sockets)) {
      //  sockets.set(ws, {username});
      //}
      try {
        const data = JSON.parse(message.toString());
        console.log('Received:', data);

        if (data.type === 'dimensions and username') {
          ws.canvasDimensions = {
            width: data.width,
            height: data.height,
            paddleWidth: data.paddleWidth,
            paddleHeight: data.paddleHeight,
            ballSize: data.ballSize
          };
          ws.username = data.username;
          return ws.send(JSON.stringify({
            type: 'starting',
          }));
        }
        else if (data.type === 'startGame') {
          if (!ws.username) {
            return ws.send(JSON.stringify({
              type: 'error',
              message: 'Username not set'
            }));
          }
          console.log(`Starting new game in ${data.mode} mode`);
          
          if (data.mode === 'online') {
            // For online mode, check waiting players first
            if (waitingPlayers.length > 0) {
              // Match with a waiting player
              const opponent = waitingPlayers.shift();
              console.log(`Matching with waiting player: ${opponent.username}`);
              
              // Create game with both players
              setupNewGame(ws, 'online', opponent);
            } else {
              // No waiting players, add to queue
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
          if (ws.gameId && ws.username) {
            updatePlayerPosition(ws.gameId, ws.username, data);
          }
        }
      } catch (error) {
        console.error('Error parsing message', error);
      }
    });
    // Handle disconnections
    ws.on('close', () => {
      console.log('Player disconnected');
      if (ws.gameId && ws.username) {
        handleDisconnect(ws.gameId, ws.username);
      }
    });
  });
});

fastify.register(connect4Handler);
fastify.register(tournamentHandler);

fastify.listen({ port: 3002, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log(`🎮 Game Service running at ${address}`);
});
