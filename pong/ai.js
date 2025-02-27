

export const aiMove = (state) => {
	const { gameStarted, rightPlayer, canvas, keys, ball } = state;
	if (!gameStarted) return;

	if (ball.y < rightPlayer.y + rightPlayer.height / 2 && rightPlayer.y > 0) {
		keys["ArrowUp"] = true;
		keys["ArrowDown"] = false;
	} else if (ball.y > rightPlayer.y + rightPlayer.height / 2 && rightPlayer.y + rightPlayer.height < canvas.height) {
		keys["ArrowUp"] = false;
		keys["ArrowDown"] = true;
	} else {
		keys["ArrowUp"] = false;
		keys["ArrowDown"] = false;
	}
};