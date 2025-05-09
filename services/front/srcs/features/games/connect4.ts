import { app, chatService } from '../../main';
import { ModalManager } from '../../shared/components/modal';
import { i18n } from '../../shared/i18n';
import { FriendService } from '../../shared/services/friendService';
import { WebsocketPage } from '../../shared/types/app';
import { Friend } from '../../shared/types/friend';
import { User } from '../../shared/types/user';
import { TokenManager } from '../../shared/utils/token';

const host = window.location.hostname;
const CONNECT4_WS_URL = `wss://${host}:8080/ws/game/connect4`;

export class Connect4 implements WebsocketPage {

  private cols = 7;
  private rows = 6;
  private won = false;
  private online = false;
  private myTurn = false;
  private canPlay = true;
  private cellSize = 100;
  private red = '#f53b3b';
  private coinPadding = 10;
  private yellow = 'yellow';
  private player = this.red;
  private user : User | null;
  private room: string | null;
  private ws : WebSocket | null;
  private friend: string | null;
  private player1: string | null;
  private player2: string | null;
  private player2Color: string | null;
  private data = new Array(42).fill('X');
  private columns = new Array(7).fill(5);
  private callback: ((winner: string) => void) | null = null;
  private canvas = null as HTMLCanvasElement | null;
  private ctx = null as CanvasRenderingContext2D | null;
  private coinRadius = (this.cellSize - this.coinPadding * 2) / 2;

  constructor(
      type : string | null, 
      player1: string | null = null, 
      player2: string | null = null, 
      callback: ((winner: string) => void) | null = null
    ) {
    const urlParams = new URLSearchParams(window.location.search);
    this.room = urlParams.get("room");
    this.friend = urlParams.get("friend");
    this.ws = null;
    this.player2 = player2 || "yellow";
    this.player2Color = "yellow";
    this.callback = callback;
    this.user = TokenManager.getUserFromLocalStorage();
    this.player1 = player1 || this.user?.username || "red";
    
    if (type == "play_vs_friend" && !this.friend && !this.room) {
      // todo: check the error: app initialized
      app.router.navigateTo("/connect4");
      // todo: translate
      ModalManager.openModal(i18n.t('games.connect4.title'), "you need to select a friend");
      return ;
    }

    const main = document.querySelector('main');

    if (type == "play_local") {
      this.myTurn = true;
      main!.innerHTML = this.renderCanvas();
      this.setupCanvasEventListener();
    } else {
      this.canPlay = false;
      this.online = true;
      this.setupWebSocket(type);
      main!.innerHTML = this.renderWaitingRoom();
    }
  }

  destroy() {
    this.ws?.close();
    this.ws = null;
    this.won = false;
    this.online = false;
    this.myTurn = false;
    this.player1 = null;
    this.player2 = null;
    this.data.fill('X');
    this.columns.fill(5);
    this.callback = null;
    this.player = this.red;
    this.player2Color = null;
  }

  drop(x: number, y: number, targetY: number, speed: number, col: number, row: number) {
    // Redraw the board on each frame
    this.drawBoard();
    
    // Draw the coin at its current position
    this.ctx!.beginPath();
    this.ctx!.arc(x, y, this.coinRadius, 0, Math.PI * 2);
    this.ctx!.fillStyle = this.player;
    this.ctx!.fill();
    this.ctx!.closePath();
    
    // Continue animating until the coin reaches the target y-coordinate
    if (y < targetY) {
      y += speed;
      if (y > targetY) y = targetY;
      requestAnimationFrame(() => this.drop(x, y, targetY, speed, col, row));
    } else {
      this.canPlay = this.myTurn;
      this.data[row * this.cols + col] = this.player == this.red ? 'R' : 'Y';
      if (!this.online && this.checkWin()) {
        ModalManager.openModal(i18n.t('games.connect4.title'), `${this.player == this.red ? this.player1 : this.player2} won`);
        this.renderBackBtn(this.player == this.red ? this.player1 : this.player2);
        this.won = true;
      }
      this.toggleColors();
      if (!this.online && this.data.every((elem) => elem != 'X')) {
        ModalManager.openModal(i18n.t('games.connect4.title'), "No winner this time, it's a tie!");
        this.renderBackBtn(this.player == this.red ? this.player1 : this.player2);
      }
      this.player = this.player == this.red ? this.yellow : this.red;
    }
  }

  animateCoin(column: number, targetRow: number) {
    // Calculate fixed x position based on the column and initial y (starting above the board)
    const x = column * this.cellSize + this.cellSize / 2;
    let y = -this.coinRadius;  // Start above the canvas
    const targetY = targetRow * this.cellSize + this.cellSize / 2;
    const speed = 15; // pixels per frame

    requestAnimationFrame(() => this.drop(x, y, targetY, speed, column, targetRow));
  }

  checkWin() : boolean {
    let idx, count, coin;
    for (let i = 0; i < this.rows; i++) {
      for (let j = 0; j < this.cols; j++ ) {
        coin = this.data[i * this.cols + j];
        if (i < 3 && coin != 'X') {
          // rows from top to bottom
          count = 0;
          for (let k = i; k < i + 4; k++) {
            idx = k * this.cols + j;
            if (this.data[idx] != coin) {
              break ;
            }
            count++;
          }
          if (count == 4) {
            return (true);
          }
        }
        if (j < 4 && coin != 'X') {
          // cols from left to right 
          count = 0;
          for (let k = j; k < j + 4; k++) {
            idx = i * this.cols + k;
            if (this.data[idx] != coin) {
              break;
            }
            count++;
          }
          if (count == 4) {
            return (true);
          }
        }
        if (i < 3 && j < 4 && coin != 'X') {
          // diag from top to bottom right
          count = 0;
          for (let k = 0; k < 4; k++) {
            idx = (i + k) * this.cols + j + k;
            if (this.data[idx] != coin) {
              break;
            }
            count++;
          }
          if (count == 4) {
            return (true);
          }
        }
        if (i > 2 && j < 4 && coin != 'X') {
          // diag from bottom to top right
          count = 0;
          for (let k = 0; k < 4; k++) {
            idx = (i - k) * this.cols + j + k;
            if (this.data[idx] != coin) {
              break;
            }
            count++;
          }
          if (count == 4) {
            return (true);
          }
        }
      }
    }
    return (false);
  }

  setupCanvasEventListener() {
    this.canvas = document.getElementById('connect4Canvas') as HTMLCanvasElement;
    this.ctx = this.canvas!.getContext('2d');

    if (!this.online) {
      this.player2Color = "yellow";
      ModalManager.openModal(i18n.t('games.connect4.title'), `${this.player1} start first`);
    }

    this.canvas!.addEventListener('click', (event) => {
      if (this.won || !this.canPlay) {
        return ;
      }
      const rect = this.canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const col = Math.floor(x / this.cellSize);
      if (this.columns[col] < 0) {
        return ;
      }
      this.canPlay = false;
      if (this.online) {
        this.myTurn = false;
        this.ws?.send(JSON.stringify({
          mode: "play",
          col,
          color: this.player == this.red ? 'R' : 'Y',
          room: this.room,
          id: this.user?.id,
          username: this.user?.username
        }));
      }
      this.animateCoin(col, this.columns[col]);
      this.columns[col]--;
    });
    this.drawBoard();
  }

  drawBoard() {
    this.ctx!.fillStyle = '#0077b6';
    this.ctx!.fillRect(0, 0, this.canvas!.width, this.canvas!.height);
    
    // Draw empty slots as white circles
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * this.cellSize + this.cellSize / 2;
        const y = row * this.cellSize + this.cellSize / 2;
        
        this.ctx!.beginPath();
        this.ctx!.arc(x, y, this.coinRadius, 0, Math.PI * 2);
        if (this.data[row * this.cols + col] == 'R') {
          this.ctx!.fillStyle = this.red;
        } else if (this.data[row * this.cols + col] == 'Y') {
          this.ctx!.fillStyle = this.yellow;
        } else {
          this.ctx!.fillStyle = '#f4f4f4';
        }
        this.ctx!.fill();
        this.ctx!.closePath();
      }
    }
  }

  setupWebSocket(type : string | null) {
    const token = TokenManager.getToken();

    this.ws = new WebSocket(`${CONNECT4_WS_URL}/friend${token ? "?token="+token : ""}`);

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({
        mode: "new",
        type,
        room: this.room,
        id: this.user?.id,
        username: this.user?.username
      }))
    }

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      console.log("message:", message);
      if (message.mode == "created") {
        // todo: send message to the friend
        // check if they are friend
        // traduction
        this.room = message.room;
        //ModalManager.openModal(i18n.t('games.connect4.title'), `here is the link to the game: http://${window.location.hostname}:8000/connect4/play_vs_friend?room=${message.room}`);
        chatService.sendMessage(JSON.stringify({
          type: "message",
          text: `${this.user} is inviting you to a connect 4 game: http://${window.location.hostname}:8000/connect4/play_vs_friend?room=${message.room}`,
          user: this.user?.username,
          userId: this.user?.id,
          friend: this.friend,
          timestamp: new Date(),
        }));
      } else if (message.mode == "connected") {
        ModalManager.openModal(i18n.t('games.connect4.title'), `you play ${message.color == 'R' ? 'first with red' : 'second with yellow'}`);
        if (type == "play_vs_AI") {
          this.room = message.room;
        }
        this.canPlay = message.color == 'R';
        this.myTurn = this.canPlay;
        this.player2 = message.opponent;
        this.player2Color = message.color == 'R' ? "yellow" : "red";
        const main = document.querySelector("main");
        main!.innerHTML = this.renderCanvas();
        this.toggleColor(this.canPlay ? "player1" : "player2");
        this.setupCanvasEventListener();
      } else if (message.mode == "win") {
        this.won = true;
        this.cleanWs()
        // todo: check translation
        ModalManager.openModal(i18n.t('games.connect4.title'), message.winner ? "you're the winner" : "you're THE loser");
        this.renderBackBtn();
      } else if (message.mode == "played") {
        this.myTurn = true;
        this.animateCoin(message.col, this.columns[message.col]);
        this.columns[message.col]--;
      } else if (message.mode == "tie") {
        this.cleanWs()
        ModalManager.openModal(i18n.t('games.connect4.title'), "No winner this time, it's a tie!");
        this.renderBackBtn();
      } else if (message.mode == "close") {
        this.cleanWs()
        app.router.navigateTo("/connect4");
        ModalManager.openModal(i18n.t('games.connect4.title'), message.message);
      }
    }

    this.ws.onclose = () => {
      if (!this.ws) {
        return ;
      }
      app.router.navigateTo("/connect4");
      ModalManager.openModal(i18n.t('games.connect4.title'), "connection lost");
    }
  }

  cleanWs() {
    this.room = null;
    let ws = this.ws;
    this.ws = null;
    ws?.close();
  }

  renderWaitingRoom() : string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('games.connect4.title')}
          </h1>
          <p class="text-light-4 dark:text-dark-0 text-center mb-8">
            waiting for your friend
          </p>
        </div>
      </div>
    `
  }

  toggleColors() {
    this.toggleColor("player1");
    this.toggleColor("player2");
  }

  toggleColor(player: string) {
    let id = `${player}Name`;
    let div = document.getElementById(id);

    if (div) {
      div.classList.toggle("bg-light-3");
      div.classList.toggle("bg-light-4");
      div.classList.toggle("dark:bg-dark-2");
      div.classList.toggle("dark:bg-dark-2/90");
    }
  }

  renderCanvas(): string {
    //if (this.online) {
      // todo: check for the width, and translate
      return `
        <div class="flex flex-col items-center justify-center h-screen">
          <div class="mb-1 flex" style="width: 700px;">
            <div id="player1Name" class="flex items=center justify-center w-1/2 bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 px-6 py-2 rounded-lg transition-colors">
              <strong>${this.player1}</strong>  -  <p>${this.player2Color == 'red' ? 'yellow' : 'red'}</p>
            </div>
            <div id="player2Name" class="flex items=center justify-center w-1/2 bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 px-6 py-2 rounded-lg transition-colors">
              <strong>${this.player2}</strong>  -  <p>${this.player2Color}</p>
            </div>
          </div>
          <canvas id="connect4Canvas" width="700" height="600" class="bg-[#0077b6] shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer"></canvas>
          <div class="mt-4 flex justify-center" id="backDiv">
          </div>
        </div>
      `;      
    //}
    //return `
    //  <div class="flex flex-col items-center justify-center h-screen">
    //    <canvas id="connect4Canvas" width="700" height="600" class="bg-[#0077b6] shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer"></canvas>
    //    <div class="mt-4 flex justify-center" id="backDiv">
    //    </div>
    //  </div>
    //`;
  }

  renderBackBtn(winner: string | null = null) {
    const backDiv = document.getElementById("backDiv");

    // todo: check SAP, just go back, but remove data
    backDiv!.innerHTML = `
      <button
        id="backBtn"
        class="bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 px-6 py-2 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors"
      >
        ${i18n.t('back')}
      </button>
    `

    const backBtn = document.getElementById("backBtn");
    backBtn?.addEventListener('click', () => {
      if (this.callback && winner) {
        this.callback(winner);
        this.destroy();
        return ;
      }
      this.destroy();
      app.router.navigateTo("/connect4");
    })
  }
}

export class Connect4HomePage {

  private loading = true;
  private friendList: Friend[] = [];

  constructor(type: string | null = null) {
    if (type == "friend_list") {
      this.loadFriendList();
      this.renderFriendList();
      return ;
    }
  }

  setupEventListener() {
    const playBtn = document.querySelectorAll(".connect4Btn");

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
        const route = "/connect4/" + type;
        app.router.navigateTo(route);
      });
    });
  }

  renderFriendList() {
    const main = document.querySelector("main");

    if (this.loading) {
      main!.innerHTML = `
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-6">
            <div class="flex justify-center items-center h-64">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-light-3 dark:border-dark-1 border-t-transparent"></div>
            </div>
          </div>
        </div>
      `;
      return ;
    }

    // todo: translate
    main!.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-6">
          <div class="flex justify-start items-center mb-6">
            <h1 class="text-2xl font-bold text-light-4 dark:text-dark-0">${i18n.t('friends')}</h1>
          </div>


          ${this.friendList.length > 0 ? `
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-light-4 dark:text-dark-0 mb-4">${i18n.t('friendsList')}</h3>
              <div class="space-y-3">
                ${this.friendList.map(friend => `
                  <div class="flex items-center justify-between p-4 bg-light-1 dark:bg-dark-3 rounded-lg">
                    <div class="flex items-center space-x-3 cursor-pointer" data-action="view-profile" data-username="${friend.username2}">
                      <img 
                        src="${friend.avatar}" 
                        alt="${friend.username2}" 
                        class="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
                      >
                      <span class="text-light-4 dark:text-dark-0">${friend.username2}</span>
                    </div>
                    <div class="space-x-2">
                      <button 
                        class="text-light-4/80 dark:text-dark-0/80
                          px-3 py-1.5 rounded-lg
                          border border-light-4/80 dark:border-dark-0/80
                          hover:text-light-0 dark:hover:text-dark-4
                          hover:bg-light-4 dark:hover:bg-dark-0
                          transition-colors"
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

        app.router.navigateTo(`/connect4/play_vs_friend?friend=${username}`);
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

  renderBtnConn(data: string, name: string): string {
    const token = TokenManager.getToken();
    let className = "connect4Btn w-full bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors";
    if (!token) {
      className = "connect4Btn not-connected w-full bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors";
    }
    return `
      <button data="${data}" class="${className}">
        ${name}
      </button>
    `;
  }

  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-light-4 dark:text-dark-0 text-center mb-6">
            ${i18n.t('games.connect4.title')}
          </h1>
          <p class="text-light-4 dark:text-dark-0 text-center mb-8">
            ${i18n.t('games.connect4.description')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button data="play_local" class="connect4Btn w-full bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-3 py-3 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors">
              ${i18n.t('games.playLocal')}
            </button>
            ${this.renderBtnConn("friend_list", i18n.t('games.playVsFriend'))}
            ${this.renderBtnConn("play_vs_AI", i18n.t('games.playVsAI'))}
            ${this.renderBtnConn("play_tournament", i18n.t('games.playTournament'))}
          </div>
        </div>
      </div>
    `;
  }
}
