import { i18n } from '../../shared/i18n';

export class Connect4 {

  private cols = 7;
  private rows = 6;
  private cellSize = 100;
  private coinPadding = 10;
  private coinRadius = (this.cellSize - this.coinPadding * 2) / 2;
  private canvas = null as HTMLCanvasElement | null;
  private ctx = null as CanvasRenderingContext2D | null;

  drop(x: number, y: number, coinColor: string, targetY: number, speed: number) {
    // Redraw the board on each frame
    this.drawBoard();
    
    // Draw the coin at its current position
    this.ctx!.beginPath();
    this.ctx!.arc(x, y, this.coinRadius, 0, Math.PI * 2);
    this.ctx!.fillStyle = coinColor;
    this.ctx!.fill();
    this.ctx!.closePath();
    
    // Continue animating until the coin reaches the target y-coordinate
    if (y < targetY) {
      y += speed;
      if (y > targetY) y = targetY;
      requestAnimationFrame(() => this.drop(x, y, coinColor, targetY, speed));
    }
  }

  animateCoin(column: number, targetRow: number, coinColor = 'red') {
    // Calculate fixed x position based on the column and initial y (starting above the board)
    const x = column * this.cellSize + this.cellSize / 2;
    let y = -this.coinRadius;  // Start above the canvas
    const targetY = targetRow * this.cellSize + this.cellSize / 2;
    const speed = 5; // pixels per frame

    requestAnimationFrame(() => this.drop(x, y, coinColor, targetY, speed));
  }

  setupCanvasEventListener() {
    this.canvas = document.getElementById('connect4Canvas') as HTMLCanvasElement;
    this.ctx = this.canvas!.getContext('2d');
    this.canvas!.addEventListener('click', (event) => {
      const rect = this.canvas!.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const col = Math.floor(x / this.cellSize);
      this.animateCoin(col, 5, 'red');
    });
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
        this.ctx!.fillStyle = '#f4f4f4';
        this.ctx!.fill();
        this.ctx!.closePath();
      }
    }
  }
  
  setupConnect4FirstPageEventListener() {
    const playLocal = document.getElementById('playLocal') as HTMLInputElement;
    
    playLocal.addEventListener('click', () => {
      console.log('Play Local clicked');
      const main = document.querySelector('main');
      main!.innerHTML = `<canvas id="connect4Canvas" width="700" height="600" class="bg-[#0077b6] shadow-[0_0_10px_rgba(0,0,0,0.5)] cursor-pointer"></canvas>`;
      this.setupCanvasEventListener();
      this.drawBoard();
    });
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
            <button id="playLocal" class="w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors">
              ${i18n.t('games.playLocal')}
            </button>
            <button id="playVsFriend" class="w-full bg-orange-light dark:bg-nature-light text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature-light/90 transition-colors">
              ${i18n.t('games.playVsFriend')}
            </button>
            <button id="playVsAI" class="w-full bg-orange-light dark:bg-nature-light text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature-light/90 transition-colors">
              ${i18n.t('games.playVsAI')}
            </button>
            <button id="playTournament" class="w-full bg-orange-light dark:bg-nature-light text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature-light/90 transition-colors">
              ${i18n.t('games.playTournament')}
            </button>
          </div>
        </div>
      </div>
    `;
  }
}