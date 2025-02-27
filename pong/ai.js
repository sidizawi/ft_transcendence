export const aiMove = (state) => {
	const { gameStarted, rightPlayer, canvas, ball } = state;
	if (!gameStarted) return;

	if (ball.y < rightPlayer.y + rightPlayer.height / 2 && rightPlayer.y > 0) {
        rightPlayer.moveUp();
    } else if (ball.y > rightPlayer.y + rightPlayer.height / 2 && rightPlayer.y + rightPlayer.height < canvas.height) {
        rightPlayer.moveDown();
    }
};