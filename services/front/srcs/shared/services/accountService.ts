import { User } from '../types/user';
import { i18n } from '../i18n';
import { TokenManager } from '../utils/token';

const host = window.location.hostname;
const USER_API_URL = `http://${host}:3000/user/settings`;
const PROFILE_API_URL = `http://${host}:3000/user/profile`;

export class AccountService {
  static async fetchAndUpdateUserProfile(): Promise<User> {
    try {
      const response = await fetch(PROFILE_API_URL, {
        method: 'GET',
        headers: TokenManager.getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = await response.json();
      if (!profile) {
        throw new Error('Profile data not found');
      }

      const user: User = {
        ...TokenManager.getUserFromLocalStorage()!,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar,
        twoFactorEnabled: profile.is_two_factor_enabled,
        google: profile.google || false,
      };

      localStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  static async updateUsername(newUsername: string): Promise<boolean> {
    try {
      const response = await fetch(`${USER_API_URL}/username`, {
        method: 'PUT',
        headers: TokenManager.getAuthHeaders(),
        body: JSON.stringify({ newUsername })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || i18n.t('updateError'));
      }

      const data = await response.json();
      TokenManager.setToken(data.token);
      
      await this.fetchAndUpdateUserProfile();
      return true;
    } catch (error) {
      console.error('Username update error:', error);
      throw error;
    }
  }

  static async checkPassword(password: string): Promise<boolean> {
    try {
      const response = await fetch(`${USER_API_URL}/check-password`, {
        method: 'POST',
        headers: TokenManager.getAuthHeaders(),
        body: JSON.stringify({ password })
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || i18n.t('updateError'));
      }
  
      const { matches } = await response.json();
      return matches;
    } catch (error) {
      console.error('Password check error:', error);
      throw error;
    }
  }
  

  static async requestProfileUpdate(payload: {
    newUsername?: string;
    newEmail?: string;
    newPassword?: string;
  }): Promise<boolean> {
    try {
      const requestResponse = await fetch(`${USER_API_URL}/update-request`, {
        method: 'POST',
        headers: TokenManager.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!requestResponse.ok) {
        const data = await requestResponse.json();
        throw new Error(data.error || i18n.t('updateError'));
      }

      return true;
    } catch (error) {
      console.error('Profile update request error:', error);
      throw error;
    }
  }

  static async confirmProfileUpdate(verificationCode: string): Promise<boolean> {
    try {
      const verifyResponse = await fetch(`${USER_API_URL}/update-confirm`, {
        method: 'PUT',
        headers: TokenManager.getAuthHeaders(),
        body: JSON.stringify({ verificationCode })
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || i18n.t('invalid2FACode'));
      }

      const data = await verifyResponse.json();
      TokenManager.setToken(data.token);
      
      await this.fetchAndUpdateUserProfile();
      return true;
    } catch (error) {
      console.error('Profile update confirmation error:', error);
      throw error;
    }
  }

  static async requestAccountDeletion(password: string): Promise<boolean> {
    try {
      const response = await fetch(`${USER_API_URL}/delete/request`, {
        method: 'POST',
        headers: TokenManager.getAuthHeaders(),
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || i18n.t('deleteAccountError'));
      }

      return true;
    } catch (error) {
      console.error('Account deletion request error:', error);
      throw error;
    }
  }

  static async confirmAccountDeletion(verificationCode: string): Promise<boolean> {
    try {
      const response = await fetch(`${USER_API_URL}/delete/confirm`, {
        method: 'DELETE',
        headers: TokenManager.getAuthHeaders(),
        body: JSON.stringify({ verificationCode })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || i18n.t('deleteAccountError'));
      }

      TokenManager.removeToken();
      localStorage.removeItem('user');
      return true;
    } catch (error) {
      console.error('Account deletion confirmation error:', error);
      throw error;
    }
  }
}