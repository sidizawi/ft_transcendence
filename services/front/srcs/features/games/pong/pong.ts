import Ball from "./Ball";
import Paddle from "./Paddle";
import { handleKeyDown, handleKeyUp, handleMouseMove, handleClick } from "./events";
import { drawMenu, gameLoop, drawWaitingScreen } from "./draw";
import { GameState, GameMessage } from './types';

// Constants
const BALL_SIZE: number = 10;
const BALL_SPEED_X: number = 4;
const BALL_SPEED_Y: number = 4;
const PADDLE_WIDTH: number = 10;
const PADDLE_HEIGHT: number = 100;
const PADDLE_SPEED: number = 5;

// Game state interface

const state: GameState = {
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

function stopGame(winner: string, state: GameState): void {
    // Game state flags
    state.gameStarted = false;
    state.gamePlayed = true;
    state.animationRunning = false;
    state.winner = winner;
    
    // Cancel animation
    if (state.gameLoopId !== null) {
        cancelAnimationFrame(state.gameLoopId);
    }
    
    // Reset paddle positions
    if (state.canvas && state.leftPlayer && state.rightPlayer) {
        state.leftPlayer.y = state.canvas.height / 2 - PADDLE_HEIGHT / 2;
        state.rightPlayer.y = state.canvas.height / 2 - PADDLE_HEIGHT / 2;
    }
    
    // Reset ball
    if (state.ball && state.canvas) {
        state.ball.x = state.canvas.width / 2;
        state.ball.y = state.canvas.height / 2;
    }
    
    // Draw the end game menu
    drawMenu(state);
}

document.addEventListener("DOMContentLoaded", (): void => {
    state.canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
    state.ctx = state.canvas.getContext("2d");
    
    state.ball = new Ball(state.canvas.width / 2, state.canvas.height / 2, BALL_SIZE, BALL_SPEED_X, BALL_SPEED_Y);
    state.leftPlayer = new Paddle(10, state.canvas.height / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
    state.rightPlayer = new Paddle(state.canvas.width - 20, state.canvas.height / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error("No token found");
        return;
    }
    const protocol: string = window.location.protocol === "https:" ? "wss" : "ws";
    state.ws = new WebSocket(`${protocol}://${window.location.hostname}:3002${token ? `?token=${token}` : ''}`);

    state.ws.onopen = (): void => {
        console.log("Connected to server");

        if (state.ws) {
            state.ws.send(JSON.stringify({
                type: 'dimensions',
                width: state.canvas?.width,
                height: state.canvas?.height,
                paddleWidth: PADDLE_WIDTH,
                paddleHeight: PADDLE_HEIGHT,
                ballSize: BALL_SIZE
            }));
        }
    }

    interface GameMessage {
        type: string;
        mode?: string;
        scores?: { left: number; right: number };
        ball?: { x: number; y: number };
        players?: { left?: number; right?: number };
        winner?: string;
    }

    state.ws.onmessage = (event: MessageEvent): void => {
        const data: GameMessage = JSON.parse(event.data);
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
            if (data.ball && state.ball) {
                state.ball.x = data.ball.x;
                state.ball.y = data.ball.y;
            }
            if (data.players) {
                if (data.players.left !== undefined && state.leftPlayer) {
                    state.leftPlayer.y = data.players.left;
                }
                if (data.players.right !== undefined && state.rightPlayer) {
                    state.rightPlayer.y = data.players.right;
                }
            }
        }
        else if (data.type === 'gameOver' && data.winner) {
            stopGame(data.winner, state);
        }
        else if (data.type === 'waitingOpponent') {
            if (state.gameLoopId !== null) {
                cancelAnimationFrame(state.gameLoopId);
            }
            state.waitingOpponent = true;
            state.gameStarted = false;
            state.gamePlayed = false;
            drawWaitingScreen(state);
        }
    }
    
    document.addEventListener("keydown", (event: KeyboardEvent) => handleKeyDown(event, state));
    document.addEventListener("keyup", (event: KeyboardEvent) => handleKeyUp(event, state));

    state.canvas.addEventListener("mousemove", (event: MouseEvent) => handleMouseMove(event, state));
    state.canvas.addEventListener("click", (event: MouseEvent) => handleClick(event, state));

    drawMenu(state);
});
