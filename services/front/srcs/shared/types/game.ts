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
  }[];
}