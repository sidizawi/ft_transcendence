export const drawMenu = (state) => {
    const { ctx, canvas, hoverSinglePlayer, hoverTwoPlayers, winner, gamePlayed } = state;
    if (!gamePlayed)
    {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Pong Game", canvas.width / 2, canvas.height / 2 - 200);

        if (hoverSinglePlayer) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText("(1) Single Player", canvas.width / 2, canvas.height / 2 - 70);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2 - 110, 300, 60);

        if (hoverTwoPlayers) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText("(2) Two Players", canvas.width / 2, canvas.height / 2 + 20);
        ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2 - 20, 300, 60);
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