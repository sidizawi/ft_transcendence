import { drawMenu } from "./draw.js";
import { startGame } from "./game.js";
import { BUTTON_WIDTH, BUTTON_HEIGHT, SINGLE_PLAYER_BUTTON, TWO_PLAYER_BUTTON, PLAY_AGAIN_BUTTON, MAIN_MENU_BUTTON } from "./draw.js";

export const handleKeyDown = (event, state) => {
    state.keys[event.key] = true;
};

export const handleKeyUp = (event, state) => {
    state.keys[event.key] = false;
};

export const handleMouseMove = (event, state) => {
    if (!state.gameStarted) {
        const rect = state.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const centerX = state.canvas.width / 2;
        const centerY = state.canvas.height / 2;
        
        if (!state.gamePlayed) {
            const singlePlayerX = centerX + SINGLE_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
            const singlePlayerY = centerY + SINGLE_PLAYER_BUTTON.y;
            state.hoverSinglePlayer = 
                x >= singlePlayerX && 
                x <= singlePlayerX + BUTTON_WIDTH &&
                y >= singlePlayerY && 
                y <= singlePlayerY + BUTTON_HEIGHT;
            
            const twoPlayerX = centerX + TWO_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
            const twoPlayerY = centerY + TWO_PLAYER_BUTTON.y;
            state.hoverTwoPlayers = 
                x >= twoPlayerX && 
                x <= twoPlayerX + BUTTON_WIDTH &&
                y >= twoPlayerY && 
                y <= twoPlayerY + BUTTON_HEIGHT;
        } else {
            const playAgainX = centerX + PLAY_AGAIN_BUTTON.x - BUTTON_WIDTH/2;
            const playAgainY = centerY + PLAY_AGAIN_BUTTON.y;
            state.hoverPlayAgain = 
                x >= playAgainX && 
                x <= playAgainX + BUTTON_WIDTH &&
                y >= playAgainY && 
                y <= playAgainY + BUTTON_HEIGHT;
            
            const mainMenuX = centerX + MAIN_MENU_BUTTON.x - BUTTON_WIDTH/2;
            const mainMenuY = centerY + MAIN_MENU_BUTTON.y;
            state.hoverMainMenu = 
                x >= mainMenuX && 
                x <= mainMenuX + BUTTON_WIDTH &&
                y >= mainMenuY && 
                y <= mainMenuY + BUTTON_HEIGHT;
            }
        drawMenu(state);
    };
};

export const handleClick = (event, state) => {
    if (!state.gameStarted) {
        const rect = state.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const centerX = state.canvas.width / 2;
        const centerY = state.canvas.height / 2;
        
        if (!state.gamePlayed) {
            const singlePlayerX = centerX + SINGLE_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
            const singlePlayerY = centerY + SINGLE_PLAYER_BUTTON.y;
            if (x >= singlePlayerX && 
                x <= singlePlayerX + BUTTON_WIDTH &&
                y >= singlePlayerY && 
                y <= singlePlayerY + BUTTON_HEIGHT) {
                state.singlePlayer = true;
                startGame(state);
            }
            
            const twoPlayerX = centerX + TWO_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
            const twoPlayerY = centerY + TWO_PLAYER_BUTTON.y;
            if (x >= twoPlayerX && 
                x <= twoPlayerX + BUTTON_WIDTH &&
                y >= twoPlayerY && 
                y <= twoPlayerY + BUTTON_HEIGHT) {
                state.singlePlayer = false;
                startGame(state);
            }
        } else {
            const playAgainX = centerX + PLAY_AGAIN_BUTTON.x - BUTTON_WIDTH/2;
            const playAgainY = centerY + PLAY_AGAIN_BUTTON.y;
            if (x >= playAgainX && 
                x <= playAgainX + BUTTON_WIDTH &&
                y >= playAgainY && 
                y <= playAgainY + BUTTON_HEIGHT) {
                startGame(state);
            }
            
            const mainMenuX = centerX + MAIN_MENU_BUTTON.x - BUTTON_WIDTH/2;
            const mainMenuY = centerY + MAIN_MENU_BUTTON.y;
            if (x >= mainMenuX && 
                x <= mainMenuX + BUTTON_WIDTH &&
                y >= mainMenuY && 
                y <= mainMenuY + BUTTON_HEIGHT) {
                state.gamePlayed = false;
                drawMenu(state);
            }
        }
    }
};