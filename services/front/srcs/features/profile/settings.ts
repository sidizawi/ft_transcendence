import { User } from '../../shared/types/user';
import { i18n } from '../../shared/i18n';
import { Router } from '../../shared/utils/routing';

const host = window.location.hostname;
const USER_API_URL = `http://${host}:3000/user`;

export class Settings {
  constructor(private user: User) {}

  private async handleAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${USER_API_URL}/profile/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload avatar');
      }

      const data = await response.json();
      this.user.avatar = data.avatarPath;
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar');
    }
  }

  private async handleUsernameUpdate(username: string) {
    try {
      const response = await fetch(`${USER_API_URL}/profile/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newUsername: username })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update username');
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/profile';
    } catch (error) {
      console.error('Username update error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update username');
    }
  }

  private async handleEmailUpdate(email: string) {
    try {
      // Request verification code
      const requestResponse = await fetch(`${USER_API_URL}/profile/email/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newEmail: email })
      });

      if (!requestResponse.ok) {
        const data = await requestResponse.json();
        throw new Error(data.error || 'Failed to request email verification');
      }

      // Prompt for verification code
      const code = prompt('Please enter the verification code sent to your email:');
      if (!code) return;

      // Verify code
      const verifyResponse = await fetch(`${USER_API_URL}/profile/email/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ verificationCode: code })
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Failed to verify email');
      }

      const data = await verifyResponse.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/profile';
    } catch (error) {
      console.error('Email update error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update email');
    }
  }

  private async handlePasswordUpdate(password: string) {
    try {
      // Request verification code
      const requestResponse = await fetch(`${USER_API_URL}/profile/password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!requestResponse.ok) {
        const data = await requestResponse.json();
        throw new Error(data.error || 'Failed to request password verification');
      }

      // Prompt for verification code
      const code = prompt('Please enter the verification code sent to your email:');
      if (!code) return;

      // Verify code and update password
      const verifyResponse = await fetch(`${USER_API_URL}/profile/password/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          verificationCode: code,
          newPassword: password
        })
      });

      if (!verifyResponse.ok) {
        const data = await verifyResponse.json();
        throw new Error(data.error || 'Failed to verify and update password');
      }

      window.location.href = '/profile';
    } catch (error) {
      console.error('Password update error:', error);
      alert(error instanceof Error ? error.message : 'Failed to update password');
    }
  }

  private async handleInfoUpdate(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (username !== this.user.username) {
      await this.handleUsernameUpdate(username);
    }

    if (email !== this.user.email) {
      await this.handleEmailUpdate(email);
    }

    if (password) {
      await this.handlePasswordUpdate(password);
    }
  }

  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-2xl">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div class="p-8">
              <!-- Avatar Section -->
              <div class="flex flex-col items-center mb-8">
                <div class="relative mb-4">
                  <img 
                    src="${this.user.avatar}" 
                    alt="${i18n.t('profile')}" 
                    class="w-32 h-32 rounded-full object-cover"
                  >
                  <label 
                    for="settings-avatar-upload" 
                    class="absolute bottom-0 right-0 bg-gray-100 dark:bg-gray-700 p-2 rounded-full shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    title="${i18n.t('changePhoto')}"
                  >
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </label>
                  <input 
                    type="file" 
                    id="settings-avatar-upload" 
                    accept="image/*"
                    class="hidden"
                  >
                </div>
              </div>

              <!-- Update Form -->
              <form id="update-info-form" class="space-y-6">
                <div>
                  <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ${i18n.t('username')}
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value="${this.user.username}"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ${i18n.t('email')}
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value="${this.user.email}"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ${i18n.t('newPassword')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div class="flex justify-center space-x-4 pt-6">
                  <a
                    href="/profile"
                    class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    ${i18n.t('back')}
                  </a>
                  <button
                    type="submit"
                    class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange dark:bg-nature hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors"
                  >
                    ${i18n.t('saveChanges')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const avatarUpload = document.getElementById('settings-avatar-upload') as HTMLInputElement;
    const updateForm = document.getElementById('update-info-form');

    avatarUpload?.addEventListener('change', (e) => this.handleAvatarChange(e));
    updateForm?.addEventListener('submit', (e) => this.handleInfoUpdate(e));
  }
}