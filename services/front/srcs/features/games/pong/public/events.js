import { drawMenu } from "./draw.js";
import { BUTTON_WIDTH, BUTTON_HEIGHT, SINGLE_PLAYER_BUTTON, TWO_PLAYER_BUTTON, PLAY_AGAIN_BUTTON, MAIN_MENU_BUTTON, ONLINE_BUTTON } from "./draw.js";

function isMouseOverButton(x, y, button, centerX, centerY) {
  const buttonX = centerX + button.x - BUTTON_WIDTH / 2;
  const buttonY = centerY + button.y;
  
  return (
    x >= buttonX && 
    x <= buttonX + BUTTON_WIDTH &&
    y >= buttonY && 
    y <= buttonY + BUTTON_HEIGHT
  );
}

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
            state.hoverSinglePlayer = isMouseOverButton(x, y, SINGLE_PLAYER_BUTTON, centerX, centerY);
            state.hoverTwoPlayers = isMouseOverButton(x, y, TWO_PLAYER_BUTTON, centerX, centerY);
            state.hoverOnline = isMouseOverButton(x, y, ONLINE_BUTTON, centerX, centerY);
        } else {
            state.hoverPlayAgain = isMouseOverButton(x, y, PLAY_AGAIN_BUTTON, centerX, centerY);
            state.hoverMainMenu = isMouseOverButton(x, y, MAIN_MENU_BUTTON, centerX, centerY);
        }
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
        
        if (!state.gamePlayed) {
            if (isMouseOverButton(x, y, SINGLE_PLAYER_BUTTON, centerX, centerY)) {
                state.ws.send(JSON.stringify({
                    type: 'startGame',
                    mode: 'singlePlayer'
                }));
            } else if (isMouseOverButton(x, y, TWO_PLAYER_BUTTON, centerX, centerY)) {
                state.ws.send(JSON.stringify({
                    type: 'startGame',
                    mode: 'twoPlayer'
                }));
            } else if (isMouseOverButton(x, y, ONLINE_BUTTON, centerX, centerY)) {
                state.ws.send(JSON.stringify({
                    type: 'startGame',
                    mode: 'online'
                }));
            }
        } else {
            if (isMouseOverButton(x, y, PLAY_AGAIN_BUTTON, centerX, centerY)) {
                state.ws.send(JSON.stringify({
                    type: 'startGame',
                    mode: state.singlePlayer ? 'singlePlayer' : 'twoPlayer'
                }));
            } else if (isMouseOverButton(x, y, MAIN_MENU_BUTTON, centerX, centerY)) {
                state.gamePlayed = false;
                drawMenu(state);
            }
        }
    }
};