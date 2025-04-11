import { aiMove } from "./ai.js";
import Ball from './Ball.js';

// Game constants
const WINNING_SCORE = 4;
const BALL_SPEED = 5;
const PADDLE_SPEED = 5;

// Game store - will hold all active games
const games = {};

// Initialize a new game
export const createGame = (gameId, wss, dimensions = null) => {
  if (games[gameId]) return games[gameId]; // Game already exists
  
  // Use provided dimensions or fallback to defaults
  const canvasDimensions = dimensions || {
    width: 800,
    height: 600,
    paddleWidth: 10,
    paddleHeight: 100,
    ballSize: 10
  };
  
  // Create new game
  games[gameId] = {
    id: gameId,
    ball: new Ball(
      canvasDimensions.width / 2, 
      canvasDimensions.height / 2, 
      canvasDimensions.ballSize, 
      0, 0
    ),
    players: {},
    scores: { left: 0, right: 0 },
    status: 'waiting',
    dimensions: canvasDimensions,
    intervalId: null,
    wss: wss,
    lastUpdate: Date.now()
  };
  
  return games[gameId];
};

// Add player to game
export const addPlayer = (gameId, playerId, ws) => {
  const game = games[gameId];
  if (!game) return null;
  
  // Determine which side the player will be on
  const side = Object.keys(game.players).length === 0 ? 'left' : 'right';
  
  // Add player to the game
  game.players[playerId] = {
    id: playerId,
    side: side,
    y: game.dimensions.height / 2 - game.dimensions.paddleHeight / 2,
    targetY: game.dimensions.height / 2 - game.dimensions.paddleHeight / 2, // Add this
    ws: ws
  };
  
  // If we have two players, start the game
  if (Object.keys(game.players).length === 2) {
    startGame(gameId);
  }
  
  return side;
};

// Update player paddle position
export const updatePlayerPosition = (gameId, playerId, data) => {
  const { y, side } = data;
  const game = games[gameId];
  if (!game || !game.players[playerId]) return;
  
  const player = Object.values(game.players).find(p => p.side === side);
  if (!player) return;
  const paddleHeight = game.dimensions.paddleHeight;
  const canvasHeight = game.dimensions.height;
  
  // Keep paddle within canvas bounds
  player.y = Math.max(0, Math.min(canvasHeight - paddleHeight, y));
};

// Start game
export const startGame = (gameId) => {
  const game = games[gameId];
  if (!game || game.status === 'playing') return;
  
  // Set initial ball direction (random angle between -45 and 45 degrees)
  resetBall(gameId, Math.random() > 0.5);
  
  game.status = 'playing';

  // Find AI player if exists
  const aiPlayer = Object.values(game.players).find(p => p.id.startsWith('ai-'));
  
  // Set up AI movement interval
  if (aiPlayer) {
    // Create AI movement interval - once per second
    game.aiInterval = setInterval(() => {
      aiMove(game.ball, aiPlayer, game.dimensions);
    }, 1000); // 1000ms = 1 second
  }
  
  // Start game loop with setInterval
  game.intervalId = setInterval(() => updateGame(gameId), 1000/60); // 60fps
};

// Stop game
export const stopGame = (gameId) => {
  const game = games[gameId];
  if (!game || game.status !== 'playing') return;
  
  // Clear the interval to stop the game loop
  if (game.intervalId) {
    clearInterval(game.intervalId);
    game.intervalId = null;
  }
  
  game.status = 'gameOver';
  
  // Broadcast game end to all players
  Object.values(game.players).forEach(player => {
    if (player.ws && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify({
        type: 'gameOver',
        winner: game.scores.left > game.scores.right ? 'left' : 'right',
        scores: game.scores
      }));
    }
  });
};

// Reset ball to center with a direction
const resetBall = (gameId, towardsLeft) => {
  const game = games[gameId];
  if (!game) return;
  
  const { width, height } = game.dimensions;
  
  // Place ball in center
  game.ball.x = width / 2;
  game.ball.y = height / 2;
  
  // Generate a random angle between -45 and 45 degrees
  const angle = (Math.random() * 90 - 45) * (Math.PI / 180);
  
  // Set the ball's speed based on the angle
  const speed = BALL_SPEED;
  game.ball.speedX = speed * Math.cos(angle);
  game.ball.speedY = speed * Math.sin(angle);
  
  // Ensure the ball moves towards the specified side
  if (towardsLeft) {
    game.ball.speedX = -Math.abs(game.ball.speedX);
  } else {
    game.ball.speedX = Math.abs(game.ball.speedX);
  }
};

// Main game update function
const updateGame = (gameId) => {
  const game = games[gameId];
  if (!game || game.status !== 'playing') return;
  
  const { ball, dimensions, players } = game;
  const { width, height, paddleWidth, paddleHeight } = dimensions;

  if (game.scores.left >= WINNING_SCORE || game.scores.right >= WINNING_SCORE) {
    const winner = game.scores.left >= WINNING_SCORE ? 'left' : 'right';
    stopGame(gameId, winner);
    return;
  }
  
  // Move ball
  ball.move();
  
  // Get players
  const leftPlayer = Object.values(players).find(p => p.side === 'left');
  const rightPlayer = Object.values(players).find(p => p.side === 'right');
  
  if (!leftPlayer || !rightPlayer) return;
  
  // Wall collision (top/bottom)
  if (ball.y <= ball.size || ball.y >= height - ball.size) {
    ball.speedY = -ball.speedY;
  }
  // Paddle collision (left)
  if (ball.x - ball.size <= paddleWidth && 
      ball.y >= leftPlayer.y && 
      ball.y <= leftPlayer.y + paddleHeight &&
      ball.speedX < 0) {
    
    ball.speedX = -ball.speedX;
    ball.x = paddleWidth + ball.size;
    
    // Add angle based on where ball hits paddle
    const hitPosition = (ball.y - leftPlayer.y) / paddleHeight;
    ball.speedY += 5 * (hitPosition - 0.5); // -2.5 to 2.5 based on hit position
  }
  
  // Paddle collision (right)
  if (ball.x + ball.size >= width - paddleWidth && 
      ball.y >= rightPlayer.y && 
      ball.y <= rightPlayer.y + paddleHeight &&
      ball.speedX > 0) {
    
    ball.speedX = -ball.speedX;
    ball.x = width - paddleWidth - ball.size;

    // Add angle based on where ball hits paddle
    const hitPosition = (ball.y - rightPlayer.y) / paddleHeight;
    ball.speedY += 5 * (hitPosition - 0.5);
  }
  
  // Score check (left)
  if (ball.x - ball.size <= 0) {
    // Right player scores
    game.scores.right++;
    resetBall(gameId, false); // Ball goes toward right player
    
    // Check win condition
    if (game.scores.right >= WINNING_SCORE) {
      stopGame(gameId);
    }
  }
  
  // Score check (right)
  if (ball.x + ball.size >= width) {
    // Left player scores
    game.scores.left++;
    resetBall(gameId, true); // Ball goes toward left player
    
    // Check win condition
    if (game.scores.left >= WINNING_SCORE) {
      stopGame(gameId);
    }
  }
  // AI move for single player mode
  // Move AI smoothly toward target
  Object.values(game.players).forEach(player => {
    if (player.id.startsWith('ai-') && player.targetY !== undefined) {
      // Move toward target position at normal paddle speed
      if (Math.abs(player.y - player.targetY) < PADDLE_SPEED) {
        player.y = player.targetY; // Arrived at target
      } else if (player.y < player.targetY) {
        player.y += PADDLE_SPEED; // Move down
      } else if (player.y > player.targetY) {
        player.y -= PADDLE_SPEED; // Move up
      }
    }
  });
  
  // Send game state to all connected players
  broadcastGameState(gameId);
};

// Broadcast current game state to all players
const broadcastGameState = (gameId) => {
  const game = games[gameId];
  if (!game) return;
  
  const gameState = {
    type: 'gameState',
    ball: {
      x: game.ball.x,
      y: game.ball.y
    },
    players: {
      left: Object.values(game.players).find(p => p.side === 'left')?.y,
      right: Object.values(game.players).find(p => p.side === 'right')?.y
    },
    scores: game.scores,
    status: game.status
  };
  
  // Send to all connected players
  Object.values(game.players).forEach(player => {
    if (player.ws && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify(gameState));
    }
  });
};

// Handle player disconnect
export const handleDisconnect = (gameId, playerId) => {
  const game = games[gameId];
  if (!game) return;
  
  // Remove player from game
  if (game.players[playerId]) {
    delete game.players[playerId];
  }
  
  // If game is in progress, end it
  if (game.status === 'playing') {
    stopGame(gameId);
  }
  
  // If no players left, clean up the game
  if (Object.keys(game.players).length === 0) {
    if (game.intervalId) {
      clearInterval(game.intervalId);
    }
    if (game.aiInterval) {
      clearInterval(game.aiInterval);
    }
    delete games[gameId];
  }
};