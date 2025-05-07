import { TokenManager } from '../utils/token';
import { GameStats, FriendGameStats } from '../types/game';

const host = window.location.hostname;
const STATS_API_URL = `https://${host}:8080/api/user/stats`;
const FRIEND_STATS_API_URL = `https://${host}:8080/api/user/friend`;

export class StatsService {
  static async getGameStats(gameType: 'pong' | 'p4'): Promise<GameStats> {
    try {
      const [statsResponse, historyResponse] = await Promise.all([
        fetch(`${STATS_API_URL}/gamestats/${gameType}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          credentials: 'include'
        }),
        fetch(`${STATS_API_URL}/gameshistory/${gameType}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          credentials: 'include'
        })
      ]);

      // Default stats when no data is available (204) or error occurs
      const defaultStats: GameStats = {
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
        rank: undefined,
        elo: undefined,
        tournaments: {
          won: 0,
          total: 0,
          winRate: 0
        },
        streak: {
          current: 0,
          best: 0,
          type: 'none'
        },
        history: []
      };

      // If either request returns 204 No Content, return default stats
      if (statsResponse.status === 204 || historyResponse.status === 204) {
        return defaultStats;
      }

      if (!statsResponse.ok || !historyResponse.ok) {
        throw new Error('Failed to fetch game stats');
      }

      const stats = await statsResponse.json();
      const history = await historyResponse.json();

      // Calculate streak from history
      let currentStreak = 0;
      let bestStreak = 0;
      let streakType: 'win' | 'loss' | 'none' = 'none';

      if (history.length > 0) {
        const firstResult = history[0].playerWin === history[0].opponent ? 'loss' : 'win';
        streakType = firstResult;
        currentStreak = 1;
        bestStreak = 1;

        for (let i = 1; i < history.length; i++) {
          const result = history[i].playerWin === history[i].opponent ? 'loss' : 'win';
          if (result === streakType) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
          } else {
            currentStreak = 1;
            streakType = result;
          }
        }
      }

      return {
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        totalGames: stats.totalGames || 0,
        winRate: stats.winrate || 0,
        rank: stats.rank,
        elo: stats.elo,
        tournaments: {
          won: stats.tournamentsWon || 0,
          total: stats.tournamentsTotal || 0,
          winRate: stats.tournamentsTotal ? ((stats.tournamentsWon || 0) / stats.tournamentsTotal) * 100 : 0
        },
        streak: {
          current: currentStreak,
          best: bestStreak,
          type: streakType
        },
        history: history.map((game: any) => ({
          date: new Date(game.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }),
          result: game.playerWin === game.opponent ? 'loss' : 'win',
          opponent: game.opponent,
          score: game.score || '',
          avatar: game.avatar
        }))
      };
    } catch (error) {
      console.error('Error fetching game stats:', error);
      // Return default stats on error
      return {
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
        rank: undefined,
        elo: undefined,
        tournaments: {
          won: 0,
          total: 0,
          winRate: 0
        },
        streak: {
          current: 0,
          best: 0,
          type: 'none'
        },
        history: []
      };
    }
  }

  static async getFriendGameStats(gameType: 'pong' | 'p4', username: string): Promise<FriendGameStats> {
    try {
      const [statsResponse, historyResponse] = await Promise.all([
        fetch(`${FRIEND_STATS_API_URL}/gamestats/${gameType}/${username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          credentials: 'include'
        }),
        fetch(`${FRIEND_STATS_API_URL}/gameshistory/${gameType}/${username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          credentials: 'include'
        })
      ]);

      // Default stats when no data is available
      const defaultStats: FriendGameStats = {
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
        rank: undefined,
        elo: undefined,
        tournaments: {
          won: 0,
          total: 0,
          winRate: 0
        },
        streak: {
          current: 0,
          best: 0,
          type: 'none'
        },
        history: []
      };

      // If either request returns 204 No Content, return default stats
      if (statsResponse.status === 204 || historyResponse.status === 204) {
        return defaultStats;
      }

      if (!statsResponse.ok || !historyResponse.ok) {
        throw new Error('Failed to fetch friend game stats');
      }

      const stats = await statsResponse.json();
      const history = await historyResponse.json();

      // Calculate streak from history
      let currentStreak = 0;
      let bestStreak = 0;
      let streakType: 'win' | 'loss' | 'none' = 'none';

      if (history.length > 0) {
        const firstResult = history[0].playerWin === username;
        streakType = firstResult ? 'win' : 'loss';
        currentStreak = 1;
        bestStreak = 1;

        for (let i = 1; i < history.length; i++) {
          const result = history[i].playerWin === username;
          if ((result && streakType === 'win') || (!result && streakType === 'loss')) {
            currentStreak++;
            bestStreak = Math.max(bestStreak, currentStreak);
          } else {
            currentStreak = 1;
            streakType = result ? 'win' : 'loss';
          }
        }
      }

      return {
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        totalGames: stats.totalGames || 0,
        winRate: stats.winrate || 0,
        rank: stats.rank,
        elo: stats.elo,
        tournaments: {
          won: stats.tournamentsWon || 0,
          total: stats.tournamentsTotal || 0,
          winRate: stats.tournamentsTotal ? ((stats.tournamentsWon || 0) / stats.tournamentsTotal) * 100 : 0
        },
        streak: {
          current: currentStreak,
          best: bestStreak,
          type: streakType
        },
        history: history.map((game: any) => ({
          opponent: game.opponent,
          score: game.score,
          playerWin: game.playerWin,
          date: new Date(game.date).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit'
          }),
          avatar: game.avatar
        }))
      };
    } catch (error) {
      console.error('Error fetching friend game stats:', error);
      return {
        wins: 0,
        losses: 0,
        totalGames: 0,
        winRate: 0,
        rank: undefined,
        elo: undefined,
        tournaments: {
          won: 0,
          total: 0,
          winRate: 0
        },
        streak: {
          current: 0,
          best: 0,
          type: 'none'
        },
        history: []
      };
    }
  }
}