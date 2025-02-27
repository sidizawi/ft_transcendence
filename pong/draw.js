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

export const drawMenu = (state) => {
    const { ctx, canvas, hoverSinglePlayer, hoverTwoPlayers, winner, gamePlayed } = state;
    
    // Calculate the center and button positions
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Set actual button positions relative to center
    const singlePlayerX = centerX + SINGLE_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
    const singlePlayerY = centerY + SINGLE_PLAYER_BUTTON.y;
    
    const twoPlayerX = centerX + TWO_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
    const twoPlayerY = centerY + TWO_PLAYER_BUTTON.y;
    
    if (!gamePlayed) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
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
        cancelAnimationFrame(state.gameLoopId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(`${winner} Wins!`, canvas.width / 2, canvas.height / 2);
        ctx.fillText("Press any key to restart", canvas.width / 2, canvas.height / 2 + 50);
    }
};

export const draw = (state) => {
    const { ctx, canvas, ball, leftPlayer, rightPlayer, leftPlayerScore, rightPlayerScore } = state;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
};