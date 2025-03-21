import { User } from '../types/user';

export class TokenManager {
  private static readonly TOKEN_KEY = 'token';
  private static readonly DEFAULT_AVATAR = '/img/default-avatar.jpg';

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  static decodeToken(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      
      const decodedPayload = atob(payload);
      return JSON.parse(decodedPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  static getUserFromToken(): User | null {
    const decoded = this.decodeToken();
    if (!decoded) return null;

    try {
      return {
        id: decoded.sub || decoded.id || decoded.userId,
        username: decoded.username || decoded.name || '',
        email: decoded.email || '',
        avatar: decoded.picture || decoded.avatar || this.DEFAULT_AVATAR,
        stats: {
          wins: decoded.stats?.wins || 0,
          losses: decoded.stats?.losses || 0,
          totalGames: decoded.stats?.totalGames || 0
        },
        twoFactorEnabled: decoded.twoFactorEnabled || false
      };
    } catch (error) {
      console.error('Error extracting user from token:', error);
      return null;
    }
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    return token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }
}