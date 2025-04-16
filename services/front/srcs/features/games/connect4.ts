import { ModalManager } from '../../shared/components/modal';
import { i18n } from '../../shared/i18n';
import { User } from '../../shared/types/user';
import { TokenManager } from '../../shared/utils/token';

export class Connect4 {

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
  private opponent: string | null;
  private opponentColor: string | null;
  private data = new Array(42).fill('X');
  private columns = new Array(7).fill(5);
  private canvas = null as HTMLCanvasElement | null;
  private ctx = null as CanvasRenderingContext2D | null;
  private coinRadius = (this.cellSize - this.coinPadding * 2) / 2;

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    this.room = urlParams.get("room");
    this.ws = null;
    this.opponent = null;
    this.opponentColor = null;
    this.user = TokenManager.getUserFromLocalStorage();
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
        ModalManager.openModal(i18n.t('games.connect4.title'), `player ${this.player == this.red ? "red" : "yellow"} won`);
        this.renderBackBtn();
        this.won = true;
      }
      if (!this.online && this.data.every((elem) => elem != 'X')) {
        ModalManager.openModal(i18n.t('games.connect4.title'), "No winner this time, it's a tie!");
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
      ModalManager.openModal(i18n.t('games.connect4.title'), "player red start first");
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
  
  setupConnect4FirstPageEventListener() {
    const playBtn = document.querySelectorAll(".connect4Btn");

    playBtn.forEach((btn) => {
      if (btn.classList.contains("not-connected")) {
        return;
      }
      btn.addEventListener('click', (event) => {
        const type = (event.target as HTMLElement).getAttribute("data");

        const main = document.querySelector('main');
        if (type == "playLocal") {
          this.myTurn = true;
          main!.innerHTML = this.renderCanvas();
          this.setupCanvasEventListener();
        } else {
          this.canPlay = false;
          this.online = true;
          this.setupWebSocket(type);
          main!.innerHTML = this.renderWaitingRoom();
        }
      });
    });
  }

  setupWebSocket(type : string | null) {
    const token = TokenManager.getToken();

    this.ws = new WebSocket(`ws://${window.location.hostname}:3000/game/connect4/friend${token ? "?token="+token : ""}`);

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
        this.room = message.room;
        console.log(message);
        ModalManager.openModal(i18n.t('games.connect4.title'), `here is the link to the game: http://${window.location.hostname}:8000/connect4?room=${message.room}`);
      } else if (message.mode == "connected") {
        ModalManager.openModal(i18n.t('games.connect4.title'), `you play ${message.color == 'R' ? 'first with red' : 'second with yellow'}`);
        if (type == "playVsAI") {
          this.room = message.room;
        }
        this.canPlay = message.color == 'R';
        this.myTurn = this.canPlay;
        this.opponent = message.opponent;
        this.opponentColor = message.color == 'R' ? "yellow" : "red";
        const main = document.querySelector("main");
        main!.innerHTML = this.renderCanvas();
        this.setupCanvasEventListener();
      } else if (message.mode == "win") {
        this.won = true;
        // todo: check translation
        ModalManager.openModal(i18n.t('games.connect4.title'), message.winner ? "you're the winner" : "you're THE loser");
        this.renderBackBtn();
      } else if (message.mode == "played") {
        this.myTurn = true;
        this.animateCoin(message.col, this.columns[message.col]);
        this.columns[message.col]--;
      } else if (message.mode == "tie") {
        ModalManager.openModal(i18n.t('games.connect4.title'), "No winner this time, it's a tie!");
        this.renderBackBtn();
      } else if (message.mode == "close") {
        this.rerender();
        ModalManager.openModal(i18n.t('games.connect4.title'), message.message);
      }
    }

    this.ws.onclose = () => {
      this.rerender();
      ModalManager.openModal(i18n.t('games.connect4.title'), "connection lost");
    }
  }

  renderWaitingRoom() : string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('games.connect4.title')}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-center mb-8">
            waiting for your friend
          </p>
        </div>
      </div>
    `
  }

  renderCanvas(): string {
    if (this.online) {
      // todo: check for the width
      return `
        <div class="flex flex-col items-center justify-center h-screen">
          <div class="mb-1 flex" style="width: 700px;">
            <div class="flex items=center justify-center w-1/2 bg-orange dark:bg-nature text-white dark:text-nature-lightes px-6 py-2 rounded-lg transition-colors">
              <strong>${this.user?.username}</strong>  -  <p>${this.opponentColor == 'red' ? 'yellow' : 'red'}</p>
            </div>
            <div class="flex items=center justify-center w-1/2 bg-orange dark:bg-nature text-white dark:text-nature-lightes px-6 py-2 rounded-lg transition-colors">
              <strong>${this.opponent}</strong>  -  <p>${this.opponentColor}</p>
            </div>
          </div>
          <canvas id="connect4Canvas" width="700" height="600" class="bg-[#0077b6] shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer"></canvas>
          <div class="mt-4 flex justify-center" id="backBtn">
          </div>
        </div>
      `;      
    }
    return `
      <div class="flex flex-col items-center justify-center h-screen">
        <canvas id="connect4Canvas" width="700" height="600" class="bg-[#0077b6] shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer"></canvas>
        <div class="mt-4 flex justify-center" id="backBtn">
        </div>
      </div>
    `;
  }

  renderBackBtn() {
    const backBtn = document.getElementById("backBtn");

    // todo: check SAP, just go back, but remove data
    backBtn!.innerHTML = `
      <a 
        href="/connect4"
        class="bg-orange dark:bg-nature text-white dark:text-nature-lightes px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
      >
        ${i18n.t('back')}
      </a>
    `
  }

  renderBtnConn(data: string, name: string): string {
    const token = TokenManager.getToken();
    let className = "connect4Btn w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors";
    if (!token) {
      className = "connect4Btn not-connected w-full bg-orange-light dark:bg-nature-light text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature-light/90 transition-colors";
    }
    return `
      <button data="${data}" class="${className}">
        ${name}
      </button>
    `;
  }

  rerender() {
    const main = document.querySelector('main');
    main!.innerHTML = this.render();
    this.setupConnect4FirstPageEventListener();
  }

  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-4xl w-full">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-6">
            ${i18n.t('games.connect4.title')}
          </h1>
          <p class="text-gray-600 dark:text-gray-400 text-center mb-8">
            ${i18n.t('games.connect4.description')}
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button data="playLocal" class="connect4Btn w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
              ${i18n.t('games.playLocal')}
            </button>
            ${this.renderBtnConn("playVsFriend", i18n.t('games.playVsFriend'))}
            ${this.renderBtnConn("playVsAI", i18n.t('games.playVsAI'))}
            ${this.renderBtnConn("playTournament", i18n.t('games.playTournament'))}
          </div>
        </div>
      </div>
    `;
  }
}
