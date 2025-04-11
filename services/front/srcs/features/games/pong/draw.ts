import { PongState, BUTTON_WIDTH, BUTTON_HEIGHT, SINGLE_PLAYER_BUTTON, 
    TWO_PLAYER_BUTTON, PLAY_AGAIN_BUTTON, MAIN_MENU_BUTTON, ONLINE_BUTTON } from "../../../shared/types/pong";


export const drawMenu = (state: PongState): void => {
    const { ctx, canvas, hoverSinglePlayer, hoverTwoPlayers, winner, gamePlayed, hoverPlayAgain, hoverMainMenu, hoverOnline } = state;
    if (!ctx || !canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const singlePlayerX = centerX + SINGLE_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
    const singlePlayerY = centerY + SINGLE_PLAYER_BUTTON.y;
    
    const twoPlayerX = centerX + TWO_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
    const twoPlayerY = centerY + TWO_PLAYER_BUTTON.y;

    const onlineX = centerX + ONLINE_BUTTON.x - BUTTON_WIDTH/2;
    const onlineY = centerY + ONLINE_BUTTON.y;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gamePlayed) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Pong Game", centerX, centerY - 200);

        if (hoverSinglePlayer) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText(SINGLE_PLAYER_BUTTON.text, centerX, centerY + SINGLE_PLAYER_BUTTON.textY);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(singlePlayerX, singlePlayerY, BUTTON_WIDTH, BUTTON_HEIGHT);

        if (hoverTwoPlayers) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText(TWO_PLAYER_BUTTON.text, centerX, centerY + TWO_PLAYER_BUTTON.textY);
        ctx.strokeRect(twoPlayerX, twoPlayerY, BUTTON_WIDTH, BUTTON_HEIGHT);
        
        if (hoverOnline) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText(ONLINE_BUTTON.text, centerX, centerY + ONLINE_BUTTON.textY);
        ctx.strokeRect(onlineX, onlineY, BUTTON_WIDTH, BUTTON_HEIGHT);
    }
    else
    {
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(`${winner} Wins!`, canvas.width / 2, 40);

        const playAgainX = centerX + PLAY_AGAIN_BUTTON.x - BUTTON_WIDTH/2;
        const playAgainY = centerY + PLAY_AGAIN_BUTTON.y;
        
        if (hoverPlayAgain) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText(PLAY_AGAIN_BUTTON.text, centerX, centerY + PLAY_AGAIN_BUTTON.textY);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(playAgainX, playAgainY, BUTTON_WIDTH, BUTTON_HEIGHT);
        
        const mainMenuX = centerX + MAIN_MENU_BUTTON.x - BUTTON_WIDTH/2;
        const mainMenuY = centerY + MAIN_MENU_BUTTON.y;
        
        if (hoverMainMenu) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText(MAIN_MENU_BUTTON.text, centerX, centerY + MAIN_MENU_BUTTON.textY);
        ctx.strokeRect(mainMenuX, mainMenuY, BUTTON_WIDTH, BUTTON_HEIGHT);
    }
};

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