export interface GameStats {
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  rank?: number;
  elo?: number;
  tournaments?: {
    won: number;
    total: number;
    winRate: number;
  };
  streak?: {
    current: number;
    best: number;
    type: 'win' | 'loss' | 'none';
  };
  history?: {
    date: string;
    result: 'win' | 'loss';
    opponent: string;
    score: string;
    avatar: string;
    online: boolean;
  }[];
}

export interface FriendGameStats {
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  rank?: number;
  elo?: number;
  tournaments?: {
    won: number;
    total: number;
    winRate: number;
  };
  streak?: {
    current: number;
    best: number;
    type: 'win' | 'loss' | 'none';
  };
  history?: {
    opponent: string;
    score: string;
    playerWin: string;
    date: string;
    avatar: string;
  }[];
}

export interface TournamentStorage {
  name: string;
  code: string;
  pub: boolean;
  game: string;
  mode: string;
  room?: string;
  round: number;
  plays: number;
  players: number;
  playersList: string[];
  winners?: Map<number, string>;
}
