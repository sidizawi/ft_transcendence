import { TokenManager } from '../utils/token';
import { Friend } from '../types/friend';

const FRIEND_API_URL = 'http://localhost:3003/friend';

export class FriendService {
  static async addFriend(username: string) {
    try {
      const response = await fetch(`${FRIEND_API_URL}/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        body: JSON.stringify({ username }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Add friend error:', error);
      throw error;
    }
  }

  static async acceptFriend(friendUsername: string) {
    try {
      const response = await fetch(`${FRIEND_API_URL}/accept`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        body: JSON.stringify({ friendusername: friendUsername }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Accept friend error:', error);
      throw error;
    }
  }

  static async rejectFriend(friendUsername: string) {
    try {
      const response = await fetch(`${FRIEND_API_URL}/reject`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        body: JSON.stringify({ friendusername: friendUsername }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Reject friend error:', error);
      throw error;
    }
  }

  static async deleteFriend(friendUsername: string) {
    try {
      const response = await fetch(`${FRIEND_API_URL}/delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        body: JSON.stringify({ friendusername: friendUsername }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete friend error:', error);
      throw error;
    }
  }

  static async blockFriend(friendUsername: string) {
    try {
      const response = await fetch(`${FRIEND_API_URL}/block`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        body: JSON.stringify({ friendusername: friendUsername }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Block friend error:', error);
      throw error;
    }
  }

  static async unblockFriend(friendUsername: string) {
    try {
      const response = await fetch(`${FRIEND_API_URL}/unblock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        body: JSON.stringify({ friendusername: friendUsername }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      return await response.json();
    } catch (error) {
      console.error('Unblock friend error:', error);
      throw error;
    }
  }

  static async getFriendsList(): Promise<Friend[]> {
    try {
      const response = await fetch(`${FRIEND_API_URL}/list`, {
        headers: {
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      return data.friendData || [];
    } catch (error) {
      console.error('Get friends list error:', error);
      throw error;
    }
  }

  static async getSendingList(): Promise<{ username2: string }[]> {
    try {
      const response = await fetch(`${FRIEND_API_URL}/sendinglist`, {
        headers: {
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      return data.onlyUsername || [];
    } catch (error) {
      console.error('Get sending list error:', error);
      throw error;
    }
  }

  static async getReceivingList(): Promise<{ username2: string }[]> {
    try {
      const response = await fetch(`${FRIEND_API_URL}/receivinglist`, {
        headers: {
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const data = await response.json();
      return data.onlyUsername || [];
    } catch (error) {
      console.error('Get receiving list error:', error);
      throw error;
    }
  }
}