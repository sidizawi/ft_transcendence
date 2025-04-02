// Add these constants at the top of the file
export const BUTTON_WIDTH = 300;
export const BUTTON_HEIGHT = 60;
export const BUTTON_MARGIN = 30;  // Space between buttons

// Button positions
export const SINGLE_PLAYER_BUTTON = {
    x: 0,  // Will be calculated relative to canvas center
    y: -110,
    text: "(1) Single Player",
    textY: -70
};

export const TWO_PLAYER_BUTTON = {
    x: 0,  // Will be calculated relative to canvas center
    y: -20,
    text: "(2) Two Players",
    textY: 20
};

export const PLAY_AGAIN_BUTTON = {
    x: 0,
    y: -20,
    text: "Play Again",
    textY: 20
};

export const MAIN_MENU_BUTTON = {
    x: 0,
    y: 70,
    text: "Main Menu",
    textY: 110
};

export const drawMenu = (state) => {
    const { ctx, canvas, hoverSinglePlayer, hoverTwoPlayers, winner, gamePlayed, hoverPlayAgain, hoverMainMenu } = state;
    
    // Calculate the center and button positions
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Set actual button positions relative to center
    const singlePlayerX = centerX + SINGLE_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
    const singlePlayerY = centerY + SINGLE_PLAYER_BUTTON.y;
    
    const twoPlayerX = centerX + TWO_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
    const twoPlayerY = centerY + TWO_PLAYER_BUTTON.y;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!gamePlayed) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Pong Game", centerX, centerY - 200);

        // Single player button
        if (hoverSinglePlayer) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText(SINGLE_PLAYER_BUTTON.text, centerX, centerY + SINGLE_PLAYER_BUTTON.textY);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(singlePlayerX, singlePlayerY, BUTTON_WIDTH, BUTTON_HEIGHT);

        // Two player button
        if (hoverTwoPlayers) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText(TWO_PLAYER_BUTTON.text, centerX, centerY + TWO_PLAYER_BUTTON.textY);
        ctx.strokeRect(twoPlayerX, twoPlayerY, BUTTON_WIDTH, BUTTON_HEIGHT);
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
        
        // Main Menu button
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

export const gameLoop = (state) => {
    const { ctx, canvas, ball, leftPlayer, rightPlayer, leftPlayerScore, rightPlayerScore, gameStarted, keys, singlePlayer } = state;
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
    ctx.fillText(leftPlayerScore, canvas.width / 2 + 50, 50);
    ctx.fillText(rightPlayerScore, (canvas.width / 2) - 50, 50);

    for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.rect(canvas.width / 2, i, 10, 10);
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fill();
        ctx.closePath();
    }

    state.gameLoopId = requestAnimationFrame(() => gameLoop(state));
};

function sendPaddlePosition(state, side) {
    const { ws, leftPlayer, rightPlayer } = state;
    if (ws && ws.readyState === ws.OPEN) {
        const paddleY = side === 'left' ? leftPlayer.y : rightPlayer.y;
        ws.send(JSON.stringify({
            type: 'paddleMove',
            side: side,
            y: paddleY
        }));
    }
}