import { TokenManager } from '../utils/token';
import { Friend } from '../types/friend';

const host = window.location.hostname;
const FRIEND_API_URL = `http://${host}:3000/chat/friend`;

export class FriendService {
  static async getFriendsList(): Promise<Friend[]> {
    try {
      const [friendsResponse, receivingResponse, sendingResponse, blockedResponse] = await Promise.all([
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
        }),
        fetch(`${FRIEND_API_URL}/sendinglist`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          credentials: 'include'
        }),
        fetch(`${FRIEND_API_URL}/blockedlist`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${TokenManager.getToken()}`
          },
          credentials: 'include'
        })
      ]);

      if (!friendsResponse.ok || !receivingResponse.ok || !sendingResponse.ok || !blockedResponse.ok) {
        throw new Error('Failed to fetch friends list');
      }

      const friendsData = await friendsResponse.json();
      const receivingData = await receivingResponse.json();
      const sendingData = await sendingResponse.json();
      const blockedData = await blockedResponse.json();

      const friends: Friend[] = [];
      const currentUser = TokenManager.getUserFromLocalStorage();

      // Add accepted friends
      if (friendsData.friendData) {
        friendsData.friendData.forEach((friend: any) => {
          friends.push({
            userid1: currentUser?.id || '',
            userid2: friend.id || '',
            username1: currentUser?.username || '',
            username2: friend.username,
            status: 'accepted',
            avatar: friend.avatar
          });
        });
      }

      // Add receiving requests
      if (receivingData.onlyUsername) {
        receivingData.onlyUsername.forEach((request: any) => {
          friends.push({
            userid1: currentUser?.id || '',
            userid2: '',
            username1: currentUser?.username || '',
            username2: request.username2,
            status: 'receiving',
            avatar: request.avatar
          });
        });
      }

      // Add sending requests
      if (sendingData.onlyUsername) {
        sendingData.onlyUsername.forEach((request: any) => {
          friends.push({
            userid1: currentUser?.id || '',
            userid2: '',
            username1: currentUser?.username || '',
            username2: request.username2,
            status: 'sending',
            avatar: request.avatar
          });
        });
      }

      // Add blocked users
      if (blockedData.onlyUsername) {
        blockedData.onlyUsername.forEach((blocked: any) => {
          friends.push({
            userid1: currentUser?.id || '',
            userid2: blocked.id || '',
            username1: currentUser?.username || '',
            username2: blocked.username2,
            status: 'blocked',
            avatar: blocked.avatar
          });
        });
      }

      return friends;
    } catch (error) {
      console.error('Get friends list error:', error);
      throw error;
    }
  }

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

  static async cancelRequest(friendUsername: string) {
    try {
      const response = await fetch(`${FRIEND_API_URL}/cancel`, {
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
      console.error('Cancel friend request error:', error);
      throw error;
    }
  }
}