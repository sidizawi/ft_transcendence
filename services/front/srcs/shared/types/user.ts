import { GameStats } from './game';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  stats: {
    pong: GameStats;
    connect4: GameStats;
  };
  twoFactorEnabled: boolean;
  online?: boolean;
  google: boolean;
}