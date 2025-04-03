import Ball from "../shared/Ball.js";
import Paddle from "../shared/Paddle.js";
import { handleKeyDown, handleKeyUp, handleMouseMove, handleClick } from "./events.js";
import { drawMenu, gameLoop, drawWaitingScreen } from "./draw.js";


const BALL_SIZE = 10;
const BALL_SPEED_X = 4;
const BALL_SPEED_Y = 4;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 5;

const state = {
    canvas: null,
    ctx: null,
    ball: null,
    leftPlayer: null,
    rightPlayer: null,
    leftPlayerScore: 0,
    rightPlayerScore: 0,
    keys: {},
    singlePlayer: false,
    gameStarted: false,
    gamePlayed: false,
    winner: null,
    hoverSinglePlayer: false,
    hoverTwoPlayers: false,
    hoverPlayAgain: false,
    hoverMainMenu: false,
    hoverOnline: false,
    gameLoopId: null,
    aiInterval: null,
    aiKeys: {},
    ws: null,
    waitingOpponent: false,
};

function stopGame(winner, state) {
    // Game state flags
    state.gameStarted = false;
    state.gamePlayed = true;
    state.animationRunning = false;
    state.winner = winner;
    
    // Cancel animation
    cancelAnimationFrame(state.gameLoopId);
    
    // Reset paddle positions
    state.leftPlayer.y = state.canvas.height / 2 - PADDLE_HEIGHT / 2;
    state.rightPlayer.y = state.canvas.height / 2 - PADDLE_HEIGHT / 2;
    
    // Reset ball
    state.ball.x = state.canvas.width / 2;
    state.ball.y = state.canvas.height / 2;
    
    // Draw the end game menu
    drawMenu(state);
}

document.addEventListener("DOMContentLoaded", () => {
    state.canvas = document.getElementById("pongCanvas");
    state.ctx = state.canvas.getContext("2d");
    
    state.ball = new Ball(state.canvas.width / 2, state.canvas.height / 2, BALL_SIZE, BALL_SPEED_X, BALL_SPEED_Y);
    state.leftPlayer = new Paddle(10, state.canvas.height / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
    state.rightPlayer = new Paddle(state.canvas.width - 20, state.canvas.height / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
    
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    state.ws = new WebSocket(`${protocol}://${window.location.hostname}:8080`);

    state.ws.onopen = () => {
        console.log("Connected to server");

        state.ws.send(JSON.stringify({
            type: 'dimensions',
            width: state.canvas.width,
            height: state.canvas.height,
            paddleWidth: PADDLE_WIDTH,
            paddleHeight: PADDLE_HEIGHT,
            ballSize: BALL_SIZE
        }));
    }

    state.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received from server:", data);
        if (data.type === 'gameStarted') {
            state.gameStarted = true;
            state.singlePlayer = data.mode === 'singlePlayer';
            state.leftPlayerScore = 0;
            state.rightPlayerScore = 0;
            if (!state.animationRunning) {
                state.animationRunning = true;
                state.gameLoopId = requestAnimationFrame(() => gameLoop(state));
            }
        }
        else if (data.type === 'gameState') {
            if (data.scores) {
                state.leftPlayerScore = data.scores.left;
                state.rightPlayerScore = data.scores.right;
            }            
            if (data.ball) {
                state.ball.x = data.ball.x;
                state.ball.y = data.ball.y;
            }
            if (data.players) {
                if (data.players.left !== undefined) {
                    state.leftPlayer.y = data.players.left;
                }
                if (data.players.right !== undefined) {
                    state.rightPlayer.y = data.players.right;
                }
            }
        }
        else if (data.type === 'gameOver') {
            stopGame(data.winner, state);
        }
        else if (data.type === 'waitingOpponent') {
            cancelAnimationFrame(state.gameLoopId);
            state.waitingOpponent = true;
            state.gameStarted = false;
            state.gamePlayed = false;
            drawWaitingScreen(state);
        }
    }
    document.addEventListener("keydown", (event) => handleKeyDown(event, state));
    document.addEventListener("keyup", (event) => handleKeyUp(event, state));

    state.canvas.addEventListener("mousemove", (event) => handleMouseMove(event, state));
    state.canvas.addEventListener("click", (event) => handleClick(event, state));

    drawMenu(state);
});