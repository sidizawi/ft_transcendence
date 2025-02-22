import { drawMenu } from "./draw.js";
import { startGame } from "./game.js";

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

        state.hoverSinglePlayer = y >= state.canvas.height / 2 - 110 && y <= state.canvas.height / 2 - 50;
        state.hoverTwoPlayers = y >= state.canvas.height / 2 - 20 && y <= state.canvas.height / 2 + 40;

        drawMenu(state);
    }
};

export const handleClick = (event, state) => {
    if (!state.gameStarted) {
        const rect = state.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        if (y >= state.canvas.height / 2 - 110 && y <= state.canvas.height / 2 - 50) {
            state.singlePlayer = true;
            startGame(state);
        } else if (y >= state.canvas.height / 2 - 20 && y <= state.canvas.height / 2 + 40) {
            state.singlePlayer = false;
            startGame(state);
        }
    }
};