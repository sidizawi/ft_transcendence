import { PongState } from "../../../shared/types/pong.ts";

export const handleKeyDown = (event: KeyboardEvent, state: PongState): void => {
	state.keys[event.key] = true;
};

export const handleKeyUp = (event: KeyboardEvent, state: PongState): void => {
	state.keys[event.key] = false;
};
