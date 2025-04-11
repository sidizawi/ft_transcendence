import { PongState } from "../../../shared/types/pong.ts";

export const gameLoop = (state: PongState): void => {
    const { ctx, canvas, ball, leftPlayer, rightPlayer, leftPlayerScore, rightPlayerScore, gameStarted, keys, singlePlayer } = state;
    if (!ctx || !canvas || !ball || !leftPlayer || !rightPlayer) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameStarted) {
        if (keys['w'] && leftPlayer.y > 0) {
            leftPlayer.moveUp();
            sendPaddlePosition(state, 'left');
        }
        if (keys['s'] && leftPlayer.y < canvas.height - leftPlayer.height) {
            leftPlayer.moveDown();
            sendPaddlePosition(state, 'left');
        }
        if (!singlePlayer) {
            if (keys['ArrowUp'] && rightPlayer.y > 0) {
                rightPlayer.moveUp();
                sendPaddlePosition(state, 'right');
            }
            if (keys['ArrowDown'] && rightPlayer.y < canvas.height - rightPlayer.height) {
                rightPlayer.moveDown();
                sendPaddlePosition(state, 'right');
            }
        }
    }
    ball.draw(ctx);
    leftPlayer.draw(ctx);
    rightPlayer.draw(ctx);

    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(leftPlayerScore.toString(), canvas.width / 2 + 50, 50);
    ctx.fillText(rightPlayerScore.toString(), (canvas.width / 2) - 50, 50);

    for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.rect(canvas.width / 2, i, 10, 10);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fill();
        ctx.closePath();
    }

    state.gameLoopId = requestAnimationFrame(() => gameLoop(state));
};

function sendPaddlePosition(state: PongState, side: 'left' | 'right'): void {
    const { ws, leftPlayer, rightPlayer } = state;
    if (ws && ws.readyState === ws.OPEN && leftPlayer && rightPlayer) {
        const paddleY = side === 'left' ? leftPlayer.y : rightPlayer.y;
        ws.send(JSON.stringify({
            type: 'paddleMove',
            side: side,
            y: paddleY
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