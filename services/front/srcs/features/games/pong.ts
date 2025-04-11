import { i18n } from '../../shared/i18n';
import { GameMessage, PongState } from '../../shared/types/pong.ts';
import { TokenManager } from '../../shared/utils/token';
import Ball from './pong/Ball';
import { drawWaitingScreen, gameLoop } from './pong/draw';
import { handleKeyDown, handleKeyUp } from './pong/event';
import Paddle from './pong/Paddle';

export class Pong {

  private BALL_SIZE = 10;
  private BALL_SPEED_X = 4;
  private BALL_SPEED_Y = 4;
  private PADDLE_WIDTH = 10;
  private PADDLE_HEIGHT = 100;
  private PADDLE_SPEED = 5;

  private state : PongState = {
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
      animationRunning: false
  };

  stopGame(winner: string): void {
    // Game state flags
    this.state.gameStarted = false;
    this.state.gamePlayed = true;
    this.state.animationRunning = false;
    this.state.winner = winner;
    
    // Cancel animation
    if (this.state.gameLoopId !== null) {
        cancelAnimationFrame(this.state.gameLoopId);
    }
    
    // Reset paddle positions
    if (this.state.canvas && this.state.leftPlayer && this.state.rightPlayer) {
        this.state.leftPlayer.y = this.state.canvas.height / 2 - this.PADDLE_HEIGHT / 2;
        this.state.rightPlayer.y = this.state.canvas.height / 2 - this.PADDLE_HEIGHT / 2;
    }
    
    // Reset ball
    if (this.state.ball && this.state.canvas) {
        this.state.ball.x = this.state.canvas.width / 2;
        this.state.ball.y = this.state.canvas.height / 2;
    }
    
    // Draw the end game menu
    //drawMenu(this.state);
    this.rerender();
  }

  canvasEventListener(type: string | null) {
    this.state.canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
    this.state.ctx = this.state.canvas.getContext("2d");
    
    this.state.ball = new Ball(this.state.canvas.width / 2, this.state.canvas.height / 2, this.BALL_SIZE, this.BALL_SPEED_X, this.BALL_SPEED_Y);
    this.state.leftPlayer = new Paddle(10, this.state.canvas.height / 2 - this.PADDLE_HEIGHT / 2, this.PADDLE_WIDTH, this.PADDLE_HEIGHT, this.PADDLE_SPEED);
    this.state.rightPlayer = new Paddle(this.state.canvas.width - 20, this.state.canvas.height / 2 - this.PADDLE_HEIGHT / 2, this.PADDLE_WIDTH, this.PADDLE_HEIGHT, this.PADDLE_SPEED);
    
    const token = TokenManager.getToken();
    const protocol: string = window.location.protocol === "https:" ? "wss" : "ws";
    this.state.ws = new WebSocket(`${protocol}://${window.location.hostname}:3000/game/ws/pong?${token ? `token=${token}` : ''}`);

    this.state.ws.onclose = () => {
      console.log("Disconnected from server");
      this.rerender();
      return ;
    }

    this.state.ws.onopen = (): void => {
        console.log("Connected to server");

        if (this.state.ws) {
            this.state.ws.send(JSON.stringify({
                type: 'dimensions',
                width: this.state.canvas?.width,
                height: this.state.canvas?.height,
                paddleWidth: this.PADDLE_WIDTH,
                paddleHeight: this.PADDLE_HEIGHT,
                ballSize: this.BALL_SIZE
            }));
        }
    }

    this.state.ws.onmessage = (event: MessageEvent): void => {
        const data: GameMessage = JSON.parse(event.data);
        console.log("Received from server:", data);
        
        if (data.type === 'starting') {
          if (type == "singlePlayer") {
            this.state.ws!.send(JSON.stringify({
              type: 'startGame',
              mode: 'singlePlayer'
            }));
          } else if (type == "twoPlayer") {
            this.state.ws!.send(JSON.stringify({
              type: 'startGame',
              mode: 'twoPlayer'
            }));
          } else if (type == "online") {
            this.state.ws!.send(JSON.stringify({
              type: 'startGame',
              mode: 'online'
            }));
          } else if (type == "playAgain") {
            this.state.ws!.send(JSON.stringify({
              type: 'startGame',
              mode: this.state.singlePlayer ? 'singlePlayer' : 'twoPlayer'
            }));
          }
        }
        else if (data.type === 'gameStarted') {
            this.state.gameStarted = true;
            this.state.singlePlayer = data.mode === 'singlePlayer';
            this.state.leftPlayerScore = 0;
            this.state.rightPlayerScore = 0;
            if (!this.state.animationRunning) {
                this.state.animationRunning = true;
                this.state.gameLoopId = requestAnimationFrame(() => gameLoop(this.state));
            }
        }
        else if (data.type === 'gameState') {
            if (data.scores) {
                this.state.leftPlayerScore = data.scores.left;
                this.state.rightPlayerScore = data.scores.right;
            }            
            if (data.ball && this.state.ball) {
                this.state.ball.x = data.ball.x;
                this.state.ball.y = data.ball.y;
            }
            if (data.players) {
                if (data.players.left !== undefined && this.state.leftPlayer) {
                    this.state.leftPlayer.y = data.players.left;
                }
                if (data.players.right !== undefined && this.state.rightPlayer) {
                    this.state.rightPlayer.y = data.players.right;
                }
            }
        }
        else if (data.type === 'gameOver' && data.winner) {
            this.stopGame(data.winner);
        }
        else if (data.type === 'waitingOpponent') {
            if (this.state.gameLoopId !== null) {
                cancelAnimationFrame(this.state.gameLoopId);
            }
            this.state.waitingOpponent = true;
            this.state.gameStarted = false;
            this.state.gamePlayed = false;
            drawWaitingScreen(this.state);
        }
    }
    
    document.addEventListener("keydown", (event: KeyboardEvent) => handleKeyDown(event, this.state));
    document.addEventListener("keyup", (event: KeyboardEvent) => handleKeyUp(event, this.state));
  }

  pongEventListener() {

    const playBtn = document.querySelectorAll(".pongPlayBtn");

    playBtn.forEach((btn) => {
      if (btn.classList.contains("not-connected")) {
        return;
      }
      btn.addEventListener('click', (event) => {
        const id = (event.target as HTMLElement).getAttribute("id")
        const main = document.querySelector("main");
        main!.innerHTML = this.renderCanvas();
        this.canvasEventListener(id);
      });
    });
  }

  className() : string {
    const token = TokenManager.getToken();
    if (!token) {
      return "not-connected w-full bg-orange-light dark:bg-nature-light text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature-light/90 transition-colors";
    }
    return "w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors";
  }

  playAgain() : string {
    if (!this.state.gamePlayed) {
      return "";
    }
    this.state.gamePlayed = false;
    let id = this.state.singlePlayer ? 'singlePlayer' : 'twoPlayer'
    let name = i18n.t('games.playVsAI');
    if (!this.state.singlePlayer) {
      name = i18n.t('games.playLocal');
    }
    return `
        <button id="${id}" class="pongPlayBtn w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
          ${name}
        </button>
    `;
  }

  renderCanvas(): string {
    return `
      <div class="flex items-center justify-center h-screen">
        <canvas id="pongCanvas" width="800" height="600" class="bg-black block mx-auto">
      </div>
    `;
  }

  rerender() {
    const main = document.querySelector("main");
    main!.innerHTML = this.render();
    this.pongEventListener();
  }

  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('games.pong.title')}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-center mb-8">
            ${i18n.t('games.pong.description')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button id="twoPlayer" class="pongPlayBtn w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
              ${i18n.t('games.playLocal')}
            </button>
            <button id="online" class="pongPlayBtn ${this.className()}">
              ${i18n.t('games.playVsFriend')}
            </button>
            <button id="singlePlayer" class="pongPlayBtn ${this.className()}">
              ${i18n.t('games.playVsAI')}
            </button>
            <button id="online" class="pongPlayBtn ${this.className()}">
              ${i18n.t('games.playTournament')}
            </button>
            ${this.playAgain()}
          </div>
        </div>
      </div>
    `;
  }
}