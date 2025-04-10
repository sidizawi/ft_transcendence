import Ball from "./Ball";
import Paddle from "./Paddle";

// Define all shared interfaces here
export interface Button {
  x: number;
  y: number;
  text: string;
  textY: number;
}

export interface GameState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  ball: Ball | null;
  leftPlayer: Paddle | null;
  rightPlayer: Paddle | null;
  leftPlayerScore: number;
  rightPlayerScore: number;
  gameStarted: boolean;
  gamePlayed: boolean;
  keys: Record<string, boolean>;
  singlePlayer: boolean;
  hoverSinglePlayer: boolean;
  hoverTwoPlayers: boolean;
  hoverOnline: boolean;
  hoverPlayAgain: boolean;
  hoverMainMenu: boolean;
  winner: string | null;
  ws: WebSocket | null;
  gameLoopId: number | null;
  waitingOpponent: boolean;
  animationRunning?: boolean;
  aiInterval: number | null;
  aiKeys: Record<string, boolean>;
  scores?: { left: number; right: number };
}

// Define the button constants
export const BUTTON_WIDTH = 300;
export const BUTTON_HEIGHT = 60;
export const BUTTON_MARGIN = 30;

export const SINGLE_PLAYER_BUTTON: Button = {
  x: 0,
  y: -110,
  text: "Single Player",
  textY: -70
};

export const TWO_PLAYER_BUTTON: Button = {
  x: 0,
  y: -20,
  text: "Two Players",
  textY: 20
};

export const PLAY_AGAIN_BUTTON: Button = {
  x: 0,
  y: -20,
  text: "Play Again",
  textY: 20
};

export const MAIN_MENU_BUTTON: Button = {
  x: 0,
  y: 70,
  text: "Main Menu",
  textY: 110
};

export const ONLINE_BUTTON: Button = {
  x: 0,
  y: 70,
  text: "Online",
  textY: 110
};

export interface GameMessage {
  type: string;
  mode?: string;
  scores?: { left: number; right: number };
  ball?: { x: number; y: number };
  players?: { left?: number; right?: number };
  winner?: string;
  side?: string;
  gameId?: string;
  playerId?: string;
}