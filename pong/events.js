import { drawMenu } from "./draw.js";
import { startGame } from "./game.js";
import { BUTTON_WIDTH, BUTTON_HEIGHT, SINGLE_PLAYER_BUTTON, TWO_PLAYER_BUTTON } from "./draw.js";

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
        
        // Check if mouse is over single player button
        const singlePlayerX = centerX + SINGLE_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
        const singlePlayerY = centerY + SINGLE_PLAYER_BUTTON.y;
        state.hoverSinglePlayer = 
            x >= singlePlayerX && 
            x <= singlePlayerX + BUTTON_WIDTH &&
            y >= singlePlayerY && 
            y <= singlePlayerY + BUTTON_HEIGHT;
        
        // Check if mouse is over two player button
        const twoPlayerX = centerX + TWO_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
        const twoPlayerY = centerY + TWO_PLAYER_BUTTON.y;
        state.hoverTwoPlayers = 
            x >= twoPlayerX && 
            x <= twoPlayerX + BUTTON_WIDTH &&
            y >= twoPlayerY && 
            y <= twoPlayerY + BUTTON_HEIGHT;

        drawMenu(state);
    }
};

export const handleClick = (event, state) => {
    if (!state.gameStarted) {
        const rect = state.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const centerX = state.canvas.width / 2;
        const centerY = state.canvas.height / 2;
        
        // Check if click is on single player button
        const singlePlayerX = centerX + SINGLE_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
        const singlePlayerY = centerY + SINGLE_PLAYER_BUTTON.y;
        if (x >= singlePlayerX && 
            x <= singlePlayerX + BUTTON_WIDTH &&
            y >= singlePlayerY && 
            y <= singlePlayerY + BUTTON_HEIGHT) {
            state.singlePlayer = true;
            startGame(state);
        }
        
        // Check if click is on two player button
        const twoPlayerX = centerX + TWO_PLAYER_BUTTON.x - BUTTON_WIDTH/2;
        const twoPlayerY = centerY + TWO_PLAYER_BUTTON.y;
        if (x >= twoPlayerX && 
            x <= twoPlayerX + BUTTON_WIDTH &&
            y >= twoPlayerY && 
            y <= twoPlayerY + BUTTON_HEIGHT) {
            state.singlePlayer = false;
            startGame(state);
        }
    }
};