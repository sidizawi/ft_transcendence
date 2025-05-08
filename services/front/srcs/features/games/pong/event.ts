import { PongState } from "../../../shared/types/pong.ts";

export const handleKeyDown = (event: KeyboardEvent, state: PongState): void => {
	state.keys[event.key] = true;
	if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
		event.preventDefault(); // todo: check that
	}
};

export const handleKeyUp = (event: KeyboardEvent, state: PongState): void => {
	state.keys[event.key] = false;
};
