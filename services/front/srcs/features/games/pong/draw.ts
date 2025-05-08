import { PongState } from "../../../shared/types/pong.ts";

export const gameLoop = (state: PongState): void => {
  const {
    ctx, canvas, ball,
    leftPlayer, rightPlayer,
    gameStarted, keys,
    playerSide, singlePlayer,
    leftPlayerScore, rightPlayerScore,
  } = state;
  if (!ctx || !canvas || !ball || !leftPlayer || !rightPlayer) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameStarted) {
    if (
      (playerSide === 'left') ||
      (!playerSide && !singlePlayer)
    ) {
      if (keys['w'] && leftPlayer.y > 0) {
        sendPaddlePosition(state, 'left', leftPlayer.y - leftPlayer.speed);
      }
      if (keys['s'] && leftPlayer.y < canvas.height - leftPlayer.height) {
        sendPaddlePosition(state, 'left', leftPlayer.y + leftPlayer.speed);
      }
    }

    if (
      (playerSide === 'right') ||
      (!playerSide && !singlePlayer)
    ) {
      if (keys['ArrowUp'] && rightPlayer.y > 0) {
        sendPaddlePosition(state, 'right', rightPlayer.y - rightPlayer.speed);
      }
      if (keys['ArrowDown'] && rightPlayer.y < canvas.height - rightPlayer.height) {
        sendPaddlePosition(state, 'right', rightPlayer.y + rightPlayer.speed);
      }
    }
  }

  ball.draw(ctx);
  leftPlayer.draw(ctx);
  rightPlayer.draw(ctx);
  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.fillText(leftPlayerScore.toString(), canvas.width / 2 - 50, 50); // Corrected position for left score
  ctx.fillText(rightPlayerScore.toString(), canvas.width / 2 + 50, 50); // Corrected position for right score

  for (let i = 0; i < canvas.height; i += 20) {
    ctx.beginPath();
    ctx.rect(canvas.width / 2 - 5, i, 10, 10); // Centered midline better
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fill();
    ctx.closePath();
  }
  
  if (state.gameStarted && state.animationRunning) {
    state.gameLoopId = requestAnimationFrame(() => gameLoop(state));
  }
};

function sendPaddlePosition(state: PongState, side: 'left' | 'right', y: number): void {
  if (state.ws?.readyState === WebSocket.OPEN) {
    state.ws.send(JSON.stringify({
      type: 'paddleMove',
      side,
      y
    }));
  }
}

export function drawWaitingScreen(state: PongState): void {
  const { ctx, canvas } = state;
  if (!ctx || !canvas) return;
  
  // Clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw waiting message
  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.fillText("Waiting for an opponent...", canvas.width/2, canvas.height/2 - 50);
  
  // Draw animated spinner
  const now = Date.now();
  const angle = (now % 2000) / 2000 * Math.PI * 2;
  
  // Draw spinner circle
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2 + 30, 25, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 3;
  ctx.stroke();
  
  // Draw spinner indicator
  ctx.beginPath();
  ctx.arc(canvas.width/2, canvas.height/2 + 30, 25, angle, angle + Math.PI/4);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // Continue animation
  if (state.waitingOpponent) {
    state.gameLoopId = requestAnimationFrame(() => drawWaitingScreen(state));
  }
}