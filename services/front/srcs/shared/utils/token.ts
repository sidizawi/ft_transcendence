import { User } from '../types/user';

export class TokenManager {
  private static readonly TOKEN_KEY = 'token';

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

    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      avatar: decoded.avatar,
      twoFactorEnabled: decoded.twoFactorEnabled,
      stats: {
        pong: {
          wins: 0,
          losses: 0,
          totalGames: 0,
          winRate: 0
        },
        connect4: {
          wins: 0,
          losses: 0,
          totalGames: 0,
          winRate: 0
        }
      },
      google: decoded.google
    };
  }

  static getUserFromLocalStorage(): User | null {
    let decoded = localStorage.getItem("user");
    if (!decoded) return null;
    return JSON.parse(decoded) as User;
  }

  static getAuthHeaders(): HeadersInit {
    const token = this.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}