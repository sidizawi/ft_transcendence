import { app, chatService } from '../../main.ts';
import { ModalManager } from '../../shared/components/modal.ts';
import { i18n } from '../../shared/i18n';
import { FriendService } from '../../shared/services/friendService.ts';
import { WebsocketPage } from '../../shared/types/app.ts';
import { Friend } from '../../shared/types/friend.ts';
import { PongState } from '../../shared/types/pong.ts';
import { User } from '../../shared/types/user.ts';
import { TokenManager } from '../../shared/utils/token';
import Ball from './pong/Ball';
import { drawWaitingScreen, gameLoop } from './pong/draw';
import { handleKeyDown, handleKeyUp } from './pong/event';
import Paddle from './pong/Paddle';

const host = window.location.hostname;
const PONG_WS_URL = `wss://${host}:8080/ws/game/pong`;

export class Pong implements WebsocketPage {

  private BALL_SIZE = 10;
  private BALL_SPEED_X = 7;
  private BALL_SPEED_Y = 7;
  private PADDLE_WIDTH = 10;
  private PADDLE_HEIGHT = 100;
  private PADDLE_SPEED = 7;

  private state : PongState = {
      canvas: null,
      ctx: null,
      ball: null,
      leftPlayer: null,
      rightPlayer: null,
      leftPlayerScore: 0,
      rightPlayerScore: 0,
      playerSide: null,
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
      animationRunning: false,
      user: TokenManager.getUserFromLocalStorage(),
  };

  private friend: String | null = null;

  constructor(type: string | null) {
    const urlParams = new URLSearchParams(window.location.search);

    if (type == "online") {
      this.friend = urlParams.get("friend");
    }
    this.render();
    this.pongEventListener(type);
  }

  destroy() {
    this.state.ws?.close();
    this.state.canvas =  null;
    this.state.ctx =  null;
    this.state.ball =  null;
    this.state.leftPlayer =  null;
    this.state.rightPlayer =  null;
    this.state.leftPlayerScore =  0;
    this.state.rightPlayerScore =  0;
    this.state.keys =  {};
    this.state.singlePlayer =  false;
    this.state.gameStarted =  false;
    this.state.gamePlayed =  false;
    this.state.winner =  null;
    this.state.hoverSinglePlayer =  false;
    this.state.hoverTwoPlayers =  false;
    this.state.hoverPlayAgain =  false;
    this.state.hoverMainMenu =  false;
    this.state.hoverOnline =  false;
    this.state.gameLoopId =  null;
    this.state.aiInterval =  null;
    this.state.aiKeys =  {};
    this.state.ws =  null;
    this.state.waitingOpponent =  false;
    this.state.animationRunning =  false;

    document.removeEventListener("keydown", (event) => handleKeyDown(event, this.state));
    document.removeEventListener("keyup", (event) => handleKeyUp(event, this.state));
  }

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
    app.router.navigateTo("/pong");
  }

  pongEventListener(type: string | null) {
    this.state.canvas = document.getElementById("pongCanvas") as HTMLCanvasElement;
    this.state.ctx = this.state.canvas.getContext("2d");
    
    this.state.ball = new Ball(this.state.canvas.width / 2, this.state.canvas.height / 2, this.BALL_SIZE, this.BALL_SPEED_X, this.BALL_SPEED_Y);
    this.state.leftPlayer = new Paddle(10, this.state.canvas.height / 2 - this.PADDLE_HEIGHT / 2, this.PADDLE_WIDTH, this.PADDLE_HEIGHT, this.PADDLE_SPEED);
    this.state.rightPlayer = new Paddle(this.state.canvas.width - 20, this.state.canvas.height / 2 - this.PADDLE_HEIGHT / 2, this.PADDLE_WIDTH, this.PADDLE_HEIGHT, this.PADDLE_SPEED);
    
    const token = TokenManager.getToken();
    this.state.ws = new WebSocket(`${PONG_WS_URL}?${token ? `token=${token}` : ''}`);

    this.state.ws.onclose = () => {
      console.log("Disconnected from server");
      return ;
    }

    this.state.ws.onopen = (): void => {
        console.log("Connected to server");
        if (this.state.ws) {
            this.state.ws.send(JSON.stringify({
                type: 'dimensions and username',
                width: this.state.canvas?.width,
                height: this.state.canvas?.height,
                paddleWidth: this.PADDLE_WIDTH,
                paddleHeight: this.PADDLE_HEIGHT,
                ballSize: this.BALL_SIZE,
                username: this.state.user?.username || ''
            }));
        }
    }
    this.state.ws.onmessage = (event: MessageEvent): void => {
        const data = JSON.parse(event.data);
        console.log("Received from server:", data);
        
        if (data.type === 'starting') {
          if (type == "singlePlayer") {
            this.state.ws?.send(JSON.stringify({
              type: 'startGame',
              mode: 'singlePlayer'
            }));
          } else if (type == "twoPlayer") {
            this.state.ws?.send(JSON.stringify({
              type: 'startGame',
              mode: 'twoPlayer'
            }));
          } else if (type == "online") {
            this.state.ws?.send(JSON.stringify({
              type: 'startGame',
              mode: 'online',
              friend: this.friend
            }));
          } else if (type == "playAgain") {
            this.state.ws?.send(JSON.stringify({
              type: 'startGame',
              mode: this.state.singlePlayer ? 'singlePlayer' : 'twoPlayer' // todo: add online
            }));
          }
        }
        else if (data.type === 'gameJoined') {
            this.state.playerSide = data.side;
        }
        else if (data.type === 'gameStarted') {
            if (data.mode !== 'online' && data.mode !== 'singlePlayer') {
              this.state.playerSide = null;
            }
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
            console.log("Waiting for opponent...");
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

  render() {
    const main = document.querySelector("main");
    if (!main) return ;

    main.innerHTML = `
      <div class="flex items-center justify-center h-screen">
        <canvas id="pongCanvas" width="800" height="600" class="bg-black block mx-auto">
      </div>
    `;
  }
}

export class PongHomePage {
    private loading = true;
    private friendList: Friend[] = [];
    private user: User | null = TokenManager.getUserFromLocalStorage();
  
    constructor(type: string | null = null) {
      if (type == "friend_list") {
        this.loadFriendList();
        this.renderFriendList();
        return ;
      }
    }
  
    setupEventListener() {
      const playBtn = document.querySelectorAll(".pongPlayBtn");
  
      playBtn.forEach((btn) => {
        if (btn.classList.contains("not-connected")) {
          return;
        }
  
        btn.addEventListener('click', (event) => {
          const type = (event.target as HTMLElement).getAttribute("data") || "";
  
          if (type == "play_tournament") {
            app.router.navigateTo("/tournament");
            return ;
          }
          const route = "/pong/" + type;
          app.router.navigateTo(route);
        });
      });
    }
  
    renderFriendList() {
      const main = document.querySelector("main");
 
      if (!main) return ;
      
      if (this.loading) {
        main.innerHTML = `
          <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-6">
              <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-light-3 dark:border-dark-2 border-t-transparent"></div>
              </div>
            </div>
          </div>
        `;
        return ;
      }
  
      // todo: translate
      main.innerHTML = `
      <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-6">
            <div class="flex justify-start items-center mb-6">
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${i18n.t('friends')}</h1>
            </div>
  
  
            ${this.friendList.length > 0 ? `
              <div class="mb-8">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${i18n.t('friendsList')}</h3>
                <div class="space-y-3">
                  ${this.friendList.map(friend => `
                    <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-3/50 rounded-lg">
                      <div class="flex items-center space-x-3 cursor-pointer" data-action="view-profile" data-username="${friend.username2}">
                        <img 
                          src="${friend.avatar}" 
                          alt="${friend.username2}" 
                          class="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
                        >
                        <span class="text-gray-900 dark:text-white">${friend.username2}</span>
                      </div>
                      <div class="space-x-2">
                        <button 
                          class="bg-green-500 hover:bg-green-600 px-3 py-1.5 roundedtext-light-0 transition-colors"
                          data-action="play"
                          data-username="${friend.username2}"
                        >
                          play with
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
      </div>
      `;
  
      document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const username = button.getAttribute('data-username');
  
          // todo: translate
          chatService.sendMessage(JSON.stringify({
            type: "message",
            text: `${this.user?.username} is inviting you to a pong game: https://${window.location.hostname}:8080/pong/online?friend=${this.user?.username}`,
            user: this.user?.username,
            userId: this.user?.id,
            friend: username,
            timestamp: new Date(),
          }));
          app.router.navigateTo(`/pong/online?friend=${username}`);
        });
      });
  
    }

    async loadFriendList() {
      try {
        this.loading = true;
        this.friendList = await FriendService.getFriendsList();
        this.friendList = this.friendList.filter((friend) => friend.status == "accepted");
        this.loading = false;
        this.renderFriendList();
      } catch (error) {
        // todo: translate
        ModalManager.openModal(i18n.t('games.connect4.title'), "loading friend list failed");
      }
    }

    className(token: string | null) : string {
      if (!token) {
        return "not-connected w-full bg-light-2 dark:bg-dark-1text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-2/90 dark:hover:bg-dark-1/90 transition-colors";
      }
      return "w-full bg-light-3 dark:bg-dark-2text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-2/90 transition-colors";
    }

    render(): string {
      const token = TokenManager.getToken();
      return `
        <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
          <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
              ${i18n.t('games.pong.title')}
            </h1>
            <p class="text-gray-600 dark:text-dark-2 text-center mb-8">
              ${i18n.t('games.pong.description')}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button data="twoPlayer" class="pongPlayBtn w-full bg-light-3 dark:bg-dark-2text-light-0 dark:text-dark-0 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-2/90 transition-colors">
                ${i18n.t('games.playLocal')}
              </button>
              <button data="playVsFriend" class="pongPlayBtn ${this.className(token)}">
                ${i18n.t('games.playVsFriend')}
              </button>
              <button data="singlePlayer" class="pongPlayBtn ${this.className(token)}">
                ${i18n.t('games.playVsAI')}
              </button>
              <button data="play_tournament" class="pongPlayBtn ${this.className(token)}">
                ${i18n.t('games.playTournament')}
              </button>
            </div>
          </div>
        </div>
      `;
    }
}
