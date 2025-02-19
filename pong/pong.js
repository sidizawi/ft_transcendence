import Ball from "./Ball.js";
import Paddle from "./Paddle.js";

document.addEventListener("DOMContentLoaded", () => {
	const canvas = document.getElementById("pongCanvas");
	const ctx = canvas.getContext("2d");

	const ball = new Ball(canvas.width / 2, canvas.height / 2, 10, 4, 4);
	const leftPlayer = new Paddle(10, canvas.height / 2 - 50, 10, 100, 5);
	const rightPlayer = new Paddle(canvas.width - 20, canvas.height / 2 - 50, 10, 100, 5);

	const keys = {};
	document.addEventListener("keydown", (event) => {
		keys[event.key] = true;
	});
	document.addEventListener("keyup", (event) => {
		keys[event.key] = false;
	});

	const draw = () => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ball.draw(ctx);
		leftPlayer.draw(ctx);
		rightPlayer.draw(ctx);
	};

	const update = () => {
		if (keys["w"] && leftPlayer.y > 0) {
			leftPlayer.moveUp();
		}
		if (keys["s"] && leftPlayer.y + leftPlayer.height < canvas.height) {
			leftPlayer.moveDown();
		}
		if (keys["ArrowUp"] && rightPlayer.y > 0) {
			rightPlayer.moveUp();
		}
		if (keys["ArrowDown"] && rightPlayer.y + rightPlayer.height < canvas.height) {
			rightPlayer.moveDown();
		}

		ball.move();

		if (ball.y + ball.size >= canvas.height || ball.y - ball.size <= 0) {
			ball.speedY *= -1;
		}

		if (ball.x - ball.size <= leftPlayer.x + leftPlayer.width) {
			if (ball.y >= leftPlayer.y && ball.y <= leftPlayer.y + leftPlayer.height) {
				ball.speedX *= -1;
				ball.x = leftPlayer.x + leftPlayer.width + ball.size;
			} else if (ball.x - ball.size < 0) {
				resetBall();
			}
		}

		if (ball.x + ball.size >= rightPlayer.x) {
			if (ball.y >= rightPlayer.y && ball.y <= rightPlayer.y + rightPlayer.height) {
				ball.speedX *= -1;
				ball.x = rightPlayer.x - ball.size;
			} else if (ball.x + ball.size > canvas.width) {
				resetBall();
			}
		}
	};

	const resetBall = () => {
		ball.x = canvas.width / 2;
		ball.y = canvas.height / 2;
		ball.speedX *= -1;
	};

	const loop = () => {
		update();
		draw();
		requestAnimationFrame(loop);
	};

	loop();
});