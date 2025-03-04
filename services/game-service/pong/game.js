import { aiMove } from "./ai.js";
import { draw, drawMenu } from "./draw.js";

const WINNING_SCORE = 2;
const BALL_SPEED = 4;

export const startGame = (state) => {
    state.gameStarted = true;
    state.leftPlayerScore = 0;
    state.rightPlayerScore = 0;
    state.gameLoopId = requestAnimationFrame(() => gameLoop(state));
    if (state.singlePlayer) {
        state.aiInterval = setInterval(() => aiMove(state), 1000);
    }
};

export const stopGame = (win, state) => {
    state.gamePlayed = true;
    state.gameStarted = false;
    state.leftPlayerScore = 0;
    state.rightPlayerScore = 0;
    state.winner = win;
    resetBall(Math.random() > 0.5, state);
    requestAnimationFrame(() => {
        const { ctx, canvas } = state;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMenu(state);
    });
};

export const update = (state) => {
    const { keys, aiKeys, leftPlayer, rightPlayer, ball, canvas, singlePlayer } = state;

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
    }
    else {
        if (aiKeys.up && rightPlayer.y > 0) {
            rightPlayer.moveUp();
        }
        if (aiKeys.down && rightPlayer.y + rightPlayer.height < canvas.height) {
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
            ball.speedY = (hitPos - 0.5) + BALL_SPEED + 2;
            let totalSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
            ball.speedX = Math.sqrt(totalSpeed * totalSpeed - ball.speedY * ball.speedY);
            ball.speedX = Math.abs(ball.speedX);
            ball.x = leftPlayer.x + leftPlayer.width + ball.size;
        } else if (ball.x - ball.size < 0) {
            state.rightPlayerScore++;
            if (state.rightPlayerScore >= WINNING_SCORE) {
                stopGame("Right Player", state);
            } else {
                resetBall(false, state);
            }
        }
    }

    if (ball.x + ball.size >= rightPlayer.x) {
        if (ball.y >= rightPlayer.y && ball.y <= rightPlayer.y + rightPlayer.height) {
            let hitPos = (ball.y - rightPlayer.y) / rightPlayer.height;
            ball.speedY = (hitPos - 0.5) + BALL_SPEED + 2;
            let totalSpeed = Math.sqrt(ball.speedX * ball.speedX + ball.speedY * ball.speedY);
            ball.speedX = Math.sqrt(totalSpeed * totalSpeed - ball.speedY * ball.speedY);
            ball.speedX = -Math.abs(ball.speedX);
            ball.x = rightPlayer.x - ball.size;
        } else if (ball.x + ball.size > canvas.width) {
            state.leftPlayerScore++;
            if (state.leftPlayerScore >= WINNING_SCORE) {
                stopGame("Left Player", state);
            } else {
                resetBall(true, state);
            }
        }
    }
};

export const resetBall = (towardsLeft, state) => {
    const { ball, canvas } = state;
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2 + (Math.random() - 0.5) * canvas.height / 2;

    // Generate a random angle between -45 and 45 degrees
    const angle = (Math.random() * 90 - 45) * (Math.PI / 180);

    // Set the ball's speed based on the angle
    const speed = BALL_SPEED; // Adjust the speed as needed
    ball.speedX = speed * Math.cos(angle);
    ball.speedY = speed * Math.sin(angle);

    // Ensure the ball moves towards the losing side
    if (towardsLeft) {
        ball.speedX = -Math.abs(ball.speedX);
    } else {
        ball.speedX = Math.abs(ball.speedX);
    }
};

export const gameLoop = (state) => {
    
    if (state.gameStarted) {
        update(state);
        draw(state);
        
        state.gameLoopId = requestAnimationFrame(() => gameLoop(state));
    }
};