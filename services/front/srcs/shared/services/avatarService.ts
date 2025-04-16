import { TokenManager } from '../utils/token';

const host = window.location.hostname;
const AVATAR_API_URL = `http://${host}:3000/user/settings/avatar`;

export class AvatarService {
  static async uploadAvatar(file: File): Promise<{ avatarPath: string }> {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }

    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size should be less than 5MB');
    }

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(AVATAR_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TokenManager.getToken()}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload avatar');
    }

    const data = await response.json();
    return {
      avatarPath: `${data.avatarPath}`
    };
  }
}