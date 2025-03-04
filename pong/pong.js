import Ball from "./Ball.js";
import Paddle from "./Paddle.js";
import { handleKeyDown, handleKeyUp, handleMouseMove, handleClick } from "./events.js";
import { drawMenu } from "./draw.js";

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
    gameLoopId: null,
    aiInterval: null,
    aiKeys: {}
};

document.addEventListener("DOMContentLoaded", () => {
    state.canvas = document.getElementById("pongCanvas");
    state.ctx = state.canvas.getContext("2d");

    state.ball = new Ball(state.canvas.width / 2, state.canvas.height / 2, BALL_SIZE, BALL_SPEED_X, BALL_SPEED_Y);
    state.leftPlayer = new Paddle(10, state.canvas.height / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);
    state.rightPlayer = new Paddle(state.canvas.width - 20, state.canvas.height / 2 - PADDLE_HEIGHT / 2, PADDLE_WIDTH, PADDLE_HEIGHT, PADDLE_SPEED);

    document.addEventListener("keydown", (event) => handleKeyDown(event, state));
    document.addEventListener("keyup", (event) => handleKeyUp(event, state));

    state.canvas.addEventListener("mousemove", (event) => handleMouseMove(event, state));
    state.canvas.addEventListener("click", (event) => handleClick(event, state));

    drawMenu(state);
});