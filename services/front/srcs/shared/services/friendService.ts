import { TokenManager } from '../utils/token';
import { Friend } from '../types/friend';

const host = window.location.hostname;
const FRIEND_API_URL = `http://${host}:3000/chat/friend`;

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
      const [friendsResponse, receivingResponse] = await Promise.all([
        fetch(`${FRIEND_API_URL}/friendlist`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          credentials: 'include'
        }),
        fetch(`${FRIEND_API_URL}/receivinglist`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          credentials: 'include'
        })
      ]);

      if (!friendsResponse.ok || !receivingResponse.ok) {
        throw new Error('Failed to fetch friends list');
      }

      const friendsData = await friendsResponse.json();
      const receivingData = await receivingResponse.json();

      // Convert the backend data format to our Friend type
      const friends: Friend[] = [];

      // Add accepted friends
      if (friendsData.friendData) {
        friendsData.friendData.forEach((friend: any) => {
          friends.push({
            userid1: TokenManager.getUserFromToken()?.id || '',
            userid2: friend.id,
            username1: TokenManager.getUserFromToken()?.username || '',
            username2: friend.username,
            status: 'accepted'
          });
        });
      }

      // Add receiving requests
      if (receivingData.onlyUsername) {
        receivingData.onlyUsername.forEach((friend: any) => {
          friends.push({
            userid1: TokenManager.getUserFromToken()?.id || '',
            userid2: '',
            username1: TokenManager.getUserFromToken()?.username || '',
            username2: friend.username2,
            status: 'receiving'
          });
        });
      }

      return friends;
    } catch (error) {
      console.error('Get friends list error:', error);
      throw error;
    }
  }
}