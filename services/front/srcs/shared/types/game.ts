export interface GameStats {
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  rank?: number;
  elo?: number;
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
  }[];
}