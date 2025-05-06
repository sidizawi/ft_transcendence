import { TokenManager } from '../utils/token';

const host = window.location.hostname;
const USER_API_URL = `http://${host}:3000/user`;

// Common fields between GameStats.history and FriendGameStats.history
type GameBase = { opponent: string; avatar: string };

async function isOpponentValid(username: string): Promise<boolean> {
  try {
    const existRes = await fetch(`${USER_API_URL}/profile/check-username/${username}`, {
      headers: TokenManager.getAuthHeaders(),
    });
    if (!existRes.ok) return false;
    const existData = await existRes.json();
    if (existData.message !== 'Username exists') return false;

    const blockedRes = await fetch(`${USER_API_URL}/profile/check-blocked/${username}`, {
      headers: TokenManager.getAuthHeaders(),
    });
    if (!blockedRes.ok) return false;
    const blockedData = await blockedRes.json();
    if (blockedData.blocked) return false;

    return true;
  } catch (error) {
    console.error('Error checking opponent validity:', error);
    return false;
  }
}

/**
 * Processes a list of games for ANY game type.
 * - Fixes avatar and opponent name if needed.
 */
export async function processGames<T extends GameBase>(games: T[]): Promise<T[]> {
  if (!games || games.length === 0) return [];

  const opponentCache = new Map<string, boolean>();

  return await Promise.all(
    games.map(async (game) => {
      if (!opponentCache.has(game.opponent)) {
        const isValid = await isOpponentValid(game.opponent);
        opponentCache.set(game.opponent, isValid);
      }

      const cachedIsValid = opponentCache.get(game.opponent);

      if (!cachedIsValid) {
        game.avatar = '/img/default-avatar.jpg';
        game.opponent = 'Unknown_user';
      }

      return game;
    })
  );
}
