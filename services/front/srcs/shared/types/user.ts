export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  stats: {
    wins: number;
    losses: number;
    totalGames: number;
  };
  twoFactorEnabled: boolean;
}