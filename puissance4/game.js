class PuissanceQuatre {
    constructor() {
        this.rows = 6;
        this.cols = 7;
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.currentPlayer = 'red';
        this.gameOver = false;
        this.moveHistory = [];
        this.scores = { red: 0, yellow: 0 };
        this.gameHistory = [];

        this.initializeBoard();
        this.initializeColumnButtons();
        this.initializeControls();
        this.updateScoreDisplay();
    }

    initializeBoard() {
        const boardElement = document.getElementById('board');
        boardElement.innerHTML = '';
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = r;
                cell.dataset.col = c;
                boardElement.appendChild(cell);
            }
        }
    }

    initializeColumnButtons() {
        const columnButtonsElement = document.getElementById('column-buttons');
        columnButtonsElement.innerHTML = '';
        for (let c = 0; c < this.cols; c++) {
            const button = document.createElement('button');
            button.setAttribute('aria-label', `Jouer dans la colonne ${c+1}`);
            button.addEventListener('click', () => this.playInColumn(c));
            columnButtonsElement.appendChild(button);
        }
    }

    initializeControls() {
        // Bouton de réinitialisation
        const resetBtn = document.getElementById('reset-btn');
        resetBtn.addEventListener('click', () => this.resetGame());

        // Bouton d'annulation
        const undoBtn = document.getElementById('undo-btn');
        undoBtn.addEventListener('click', () => this.undoLastMove());
    }

    playInColumn(col) {
        if (this.gameOver) return;

        for (let r = this.rows - 1; r >= 0; r--) {
            if (this.board[r][col] === null) {
                // Sauvegarde de l'état avant le coup
                const moveCopy = {
                    row: r,
                    col: col,
                    player: this.currentPlayer,
                    boardState: this.board.map(row => [...row])
                };
                this.moveHistory.push(moveCopy);

                this.board[r][col] = this.currentPlayer;
                this.updateCell(r, col);
                
                if (this.checkWin(r, col)) {
                    this.endGame();
                    return;
                }

                this.switchPlayer();
                break;
            }
        }
    }

    undoLastMove() {
        if (this.moveHistory.length === 0) return;

        const lastMove = this.moveHistory.pop();
        this.board = lastMove.boardState;
        this.currentPlayer = lastMove.player;

        // Réafficher le plateau
        this.refreshBoard();
        
        // Mettre à jour le statut
        this.updateStatusDisplay();
    }

    refreshBoard() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
                cell.classList.remove('red', 'yellow');
                if (this.board[r][c]) {
                    cell.classList.add(this.board[r][c]);
                }
            }
        }
    }

    updateCell(row, col) {
        const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cell.classList.add(this.currentPlayer);
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'red' ? 'yellow' : 'red';
        this.updateStatusDisplay();
    }

    updateStatusDisplay() {
        document.getElementById('status').textContent = 
            `C'est au tour du Joueur ${this.currentPlayer === 'red' ? 'Rouge ' : 'Jaune '}`;
    }

    checkWin(row, col) {
        const directions = [
            [0, 1],   // horizontal
            [1, 0],   // vertical
            [1, 1],   // diagonale droite
            [1, -1]   // diagonale gauche
        ];

        for (let [dRow, dCol] of directions) {
            if (this.countConsecutive(row, col, dRow, dCol) >= 4) {
                return true;
            }
        }
        return false;
    }

    countConsecutive(row, col, dRow, dCol) {
        let count = 1;
        const player = this.board[row][col];

        // Vérifier dans une direction
        for (let i = 1; i < 4; i++) {
            const newRow = row + dRow * i;
            const newCol = col + dCol * i;
            if (
                newRow >= 0 && newRow < this.rows &&
                newCol >= 0 && newCol < this.cols &&
                this.board[newRow][newCol] === player
            ) {
                count++;
            } else {
                break;
            }
        }

        // Vérifier dans la direction opposée
        for (let i = 1; i < 4; i++) {
            const newRow = row - dRow * i;
            const newCol = col - dCol * i;
            if (
                newRow >= 0 && newRow < this.rows &&
                newCol >= 0 && newCol < this.cols &&
                this.board[newRow][newCol] === player
            ) {
                count++;
            } else {
                break;
            }
        }

        return count;
    }

    endGame() {
        this.gameOver = true;
        const winner = this.currentPlayer;
        
        // Mettre à jour le score
        this.scores[winner]++;
        this.updateScoreDisplay();

        // Ajouter à l'historique des parties
        const gameResult = {
            winner: winner === 'red' ? 'Rouge' : 'Jaune',
            timestamp: new Date().toLocaleString()
        };
        this.gameHistory.unshift(gameResult);
        this.updateGameHistory();

        // Afficher le message de victoire
        document.getElementById('status').textContent = 
            `Le Joueur ${winner === 'red' ? 'Rouge' : 'Jaune'} a gagné !`;
    }

    updateScoreDisplay() {
        document.querySelector('.red-score').textContent = 
            `Joueur Rouge: ${this.scores.red}`;
        document.querySelector('.yellow-score').textContent = 
            `Joueur Jaune: ${this.scores.yellow}`;
    }

    updateGameHistory() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        this.gameHistory.slice(0, 5).forEach((game, index) => {
            const li = document.createElement('li');
            li.textContent = `Partie ${index + 1}: Gagnant ${game.winner} (${game.timestamp})`;
            historyList.appendChild(li);
        });
    }

    resetGame() {
        // Réinitialiser le plateau
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.currentPlayer = 'red';
        this.gameOver = false;
        this.moveHistory = [];

        // Réafficher le plateau
        this.refreshBoard();

        // Réinitialiser le statut
        this.updateStatusDisplay();
    }
}

// Initialiser le jeu
const jeu = new PuissanceQuatre();