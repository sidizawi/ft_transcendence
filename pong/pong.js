import Ball from "./Ball.js";
import Paddle from "./Paddle.js";

document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("pongCanvas");
    const ctx = canvas.getContext("2d");

    const ball = new Ball(canvas.width / 2, canvas.height / 2, 10, 6, 6);
    const leftPlayer = new Paddle(10, canvas.height / 2 - 50, 10, 100, 5);
    const rightPlayer = new Paddle(canvas.width - 20, canvas.height / 2 - 50, 10, 100, 5);

    let leftPlayerScore = 0;
    let rightPlayerScore = 0;

    const keys = {};
    document.addEventListener("keydown", (event) => {
        keys[event.key] = true;
    });
    document.addEventListener("keyup", (event) => {
        keys[event.key] = false;
    });

    let singlePlayer = false;
    let gameStarted = false;
    let hoverSinglePlayer = false;
    let hoverTwoPlayers = false;
    let gameLoopId;

    const drawMenu = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText("Pong Game", canvas.width / 2, canvas.height / 2 - 200);

        // Draw Single Player option
        if (hoverSinglePlayer) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText("(1) Single Player", canvas.width / 2, canvas.height / 2 - 70);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2 - 110, 300, 60);

        // Draw Two Players option
        if (hoverTwoPlayers) {
            ctx.fillStyle = "yellow";
        } else {
            ctx.fillStyle = "white";
        }
        ctx.fillText("(2) Two Players", canvas.width / 2, canvas.height / 2 + 20);
        ctx.strokeRect(canvas.width / 2 - 150, canvas.height / 2 - 20, 300, 60);
    };

    const startGame = () => {
        gameStarted = true;
        leftPlayerScore = 0;
        rightPlayerScore = 0;
        gameLoopId = requestAnimationFrame(gameLoop);
        if (singlePlayer) {
            setInterval(aiMove, 1000); // AI refreshes its view every second
        }
    };

    const stopGame = (winner) => {
        gameStarted = false;
        cancelAnimationFrame(gameLoopId);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "30px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(`${winner} Wins!`, canvas.width / 2, canvas.height / 2);
        ctx.fillText("Press any key to restart", canvas.width / 2, canvas.height / 2 + 50);
    };

    document.addEventListener("keydown", (event) => {
        if (!gameStarted) {
            if (event.key === "1") {
                singlePlayer = true;
                startGame();
            } else if (event.key === "2") {
                singlePlayer = false;
                startGame();
            } else {
                drawMenu();
            }
        }
    });

    canvas.addEventListener("mousemove", (event) => {
        if (!gameStarted) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            hoverSinglePlayer = y >= canvas.height / 2 - 110 && y <= canvas.height / 2 - 50;
            hoverTwoPlayers = y >= canvas.height / 2 - 20 && y <= canvas.height / 2 + 40;

            drawMenu();
        }
    });

    canvas.addEventListener("click", (event) => {
        if (!gameStarted) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (y >= canvas.height / 2 - 110 && y <= canvas.height / 2 - 50) {
                singlePlayer = true;
                startGame();
            } else if (y >= canvas.height / 2 - 20 && y <= canvas.height / 2 + 40) {
                singlePlayer = false;
                startGame();
            }
        }
    });

    const aiMove = () => {
        if (!gameStarted) return;

        // AI logic to move the right paddle
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

    const draw = () => {
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

    const update = () => {
        if (keys["w"] && leftPlayer.y > 0) {
            leftPlayer.moveUp();
        }
        if (keys["s"] && leftPlayer.y + leftPlayer.height < canvas.height) {
            leftPlayer.moveDown();
        }
        if (!singlePlayer) {
            if (keys["ArrowUp"] && rightPlayer.y > 0) {
                rightPlayer.moveUp();
            }
            if (keys["ArrowDown"] && rightPlayer.y + rightPlayer.height < canvas.height) {
                rightPlayer.moveDown();
            }
        } else {
            // AI logic for single player mode
            if (keys["ArrowUp"] && rightPlayer.y > 0) {
                rightPlayer.moveUp();
            }
            if (keys["ArrowDown"] && rightPlayer.y + rightPlayer.height < canvas.height) {
                rightPlayer.moveDown();
            }
        }

        ball.move();

        if (ball.y + ball.size >= canvas.height || ball.y - ball.size <= 0) {
            ball.speedY *= -1;
        }

        if (ball.x - ball.size <= leftPlayer.x + leftPlayer.width) {
            if (ball.y >= leftPlayer.y && ball.y <= leftPlayer.y + leftPlayer.height) {
                let hitPos = (ball.y - leftPlayer.y) / leftPlayer.height;
                ball.speedY = (hitPos - 0.5) * 8;
                let totalSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
                ball.speedX = Math.sqrt(totalSpeed * totalSpeed - ball.speedY * ball.speedY);
                ball.speedX = Math.abs(ball.speedX); // Ensure the ball moves to the right
                ball.x = leftPlayer.x + leftPlayer.width + ball.size; // Update ball position
            } else if (ball.x - ball.size < 0) {
                rightPlayerScore++;
                if (rightPlayerScore >= 5) {
                    stopGame("Right Player");
                } else {
                    resetBall(false);
                }
            }
        }

        if (ball.x + ball.size >= rightPlayer.x) {
            if (ball.y >= rightPlayer.y && ball.y <= rightPlayer.y + rightPlayer.height) {
                let hitPos = (ball.y - rightPlayer.y) / rightPlayer.height;
                ball.speedY = (hitPos - 0.5) * 8;
                let totalSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
                ball.speedX = Math.sqrt(totalSpeed * totalSpeed - ball.speedY * ball.speedY);
                ball.speedX = -Math.abs(ball.speedX); // Ensure the ball moves to the left
                ball.x = rightPlayer.x - ball.size; // Update ball position
            } else if (ball.x + ball.size > canvas.width) {
                leftPlayerScore++;
                if (leftPlayerScore >= 5) {
                    stopGame("Left Player");
                } else {
                    resetBall(true);
                }
            }
        }
    };

    const resetBall = (towardsLeft) => {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;

        // Generate a random angle between -45 and 45 degrees
        const angle = (Math.random() * 90 - 45) * (Math.PI / 180);

        // Set the ball's speed based on the angle
        const speed = 4; // Adjust the speed as needed
        ball.speedX = speed * Math.cos(angle);
        ball.speedY = speed * Math.sin(angle);

        // Ensure the ball moves towards the losing side
        if (towardsLeft) {
            ball.speedX = -Math.abs(ball.speedX);
        } else {
            ball.speedX = Math.abs(ball.speedX);
        }
    };

    const gameLoop = () => {
        if (gameStarted) {
            update();
            draw();
            gameLoopId = requestAnimationFrame(gameLoop);
        }
    };

    drawMenu();
});