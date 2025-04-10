import { User } from '../../shared/types/user';
import { i18n } from '../../shared/i18n';
import { Router } from '../../shared/utils/routing';
import { AvatarService } from '../../shared/services/avatarService';

const host = window.location.hostname;
const USER_API_URL = `http://${host}:3000/user/profile/profile`;

export class Settings {
  constructor(private user: User) {}

  private async handleAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const { avatarPath } = await AvatarService.uploadAvatar(file);
      // Update the user's avatar in memory
      this.user.avatar = avatarPath;
      // Update the view to show the new avatar
      this.updateView();
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(error instanceof Error ? error.message : i18n.t('updateError'));
    }
  }

  private async handleUsernameUpdate(username: string) {
    try {
      const response = await fetch(`${USER_API_URL}/username`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newUsername: username })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || i18n.t('updateError'));
      }

      const data = await response.json();
      localStorage.setItem('token', data.token);
      window.location.href = '/profile';
    } catch (error) {
      console.error('Username update error:', error);
      alert(error instanceof Error ? error.message : i18n.t('updateError'));
    }
  }

  private createVerificationModal(title: string): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          ${title}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          ${i18n.t('checkEmailForCode')}
        </p>
        <div class="mb-4">
          <input 
            type="text" 
            id="verification-code"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange dark:focus:ring-nature focus:border-transparent"
            placeholder="000000"
            maxlength="6"
            pattern="[0-9]*"
            inputmode="numeric"
            autocomplete="one-time-code"
          >
        </div>
        <div class="flex justify-end space-x-4">
          <button 
            id="cancel-verification"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ${i18n.t('cancel')}
          </button>
          <button 
            id="verify-code"
            class="px-4 py-2 bg-orange dark:bg-nature text-white dark:text-nature-lightest rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 relative"
            disabled
          >
            <span class="verify-text">${i18n.t('verify')}</span>
            <span class="loading-spinner hidden">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </span>
          </button>
        </div>
        <div id="verification-message" class="mt-4 hidden"></div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  private showVerificationError(message: string) {
    const messageDiv = document.getElementById('verification-message');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
      messageDiv.classList.remove('hidden');
    }
  }

  private async handleEmailUpdate(email: string): Promise<boolean> {
    try {
      const requestResponse = await fetch(`${USER_API_URL}/email/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newEmail: email })
      });

      if (!requestResponse.ok) {
        const data = await requestResponse.json();
        throw new Error(data.error || i18n.t('updateError'));
      }

      return new Promise((resolve) => {
        const modal = this.createVerificationModal(i18n.t('emailVerification'));
        const verifyButton = document.getElementById('verify-code') as HTMLButtonElement;
        const cancelButton = document.getElementById('cancel-verification');
        const codeInput = document.getElementById('verification-code') as HTMLInputElement;
        const loadingSpinner = modal.querySelector('.loading-spinner');
        const verifyText = modal.querySelector('.verify-text');

        const updateVerifyButton = () => {
          const code = codeInput.value.trim();
          verifyButton.disabled = !code || code.length !== 6 || !/^\d+$/.test(code);
        };

        const handleVerify = async () => {
          const code = codeInput.value.trim();
          if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            this.showVerificationError(i18n.t('invalid2FACode'));
            return;
          }

          try {
            verifyButton.disabled = true;
            loadingSpinner?.classList.remove('hidden');
            verifyText?.classList.add('hidden');

            const verifyResponse = await fetch(`${USER_API_URL}/email/verify`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ verificationCode: code })
            });

            if (verifyResponse.ok) {
              const data = await verifyResponse.json();
              localStorage.setItem('token', data.token);
              modal.remove();
              resolve(true);
              window.location.href = '/profile';
            } else {
              const data = await verifyResponse.json();
              this.showVerificationError(data.error || i18n.t('invalid2FACode'));
              codeInput.value = '';
              codeInput.focus();
            }
          } catch (error) {
            console.error('Email verification error:', error);
            this.showVerificationError(i18n.t('verificationError'));
          } finally {
            verifyButton.disabled = false;
            loadingSpinner?.classList.add('hidden');
            verifyText?.classList.remove('hidden');
          }
        };

        codeInput?.addEventListener('input', updateVerifyButton);
        verifyButton?.addEventListener('click', handleVerify);
        codeInput?.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !verifyButton.disabled) {
            e.preventDefault();
            handleVerify();
          }
        });

        cancelButton?.addEventListener('click', () => {
          modal.remove();
          resolve(false);
        });

        setTimeout(() => codeInput?.focus(), 100);
      });
    } catch (error) {
      console.error('Email update error:', error);
      alert(error instanceof Error ? error.message : i18n.t('updateError'));
      return false;
    }
  }

  private async handlePasswordUpdate(password: string): Promise<boolean> {
    try {
      const requestResponse = await fetch(`${USER_API_URL}/password/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword: password })
      });

      if (!requestResponse.ok) {
        const data = await requestResponse.json();
        throw new Error(data.error || i18n.t('updateError'));
      }

      return new Promise((resolve) => {
        const modal = this.createVerificationModal(i18n.t('passwordVerification'));
        const verifyButton = document.getElementById('verify-code') as HTMLButtonElement;
        const cancelButton = document.getElementById('cancel-verification');
        const codeInput = document.getElementById('verification-code') as HTMLInputElement;
        const loadingSpinner = modal.querySelector('.loading-spinner');
        const verifyText = modal.querySelector('.verify-text');

        const updateVerifyButton = () => {
          const code = codeInput.value.trim();
          verifyButton.disabled = !code || code.length !== 6 || !/^\d+$/.test(code);
        };

        const handleVerify = async () => {
          const code = codeInput.value.trim();
          if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            this.showVerificationError(i18n.t('invalid2FACode'));
            return;
          }

          try {
            verifyButton.disabled = true;
            loadingSpinner?.classList.remove('hidden');
            verifyText?.classList.add('hidden');

            const verifyResponse = await fetch(`${USER_API_URL}/password/verify`, {
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

            if (verifyResponse.ok) {
              modal.remove();
              resolve(true);
              window.location.href = '/profile';
            } else {
              const data = await verifyResponse.json();
              this.showVerificationError(data.error || i18n.t('invalid2FACode'));
              codeInput.value = '';
              codeInput.focus();
            }
          } catch (error) {
            console.error('Password verification error:', error);
            this.showVerificationError(i18n.t('verificationError'));
          } finally {
            verifyButton.disabled = false;
            loadingSpinner?.classList.add('hidden');
            verifyText?.classList.remove('hidden');
          }
        };

        codeInput?.addEventListener('input', updateVerifyButton);
        verifyButton?.addEventListener('click', handleVerify);
        codeInput?.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && !verifyButton.disabled) {
            e.preventDefault();
            handleVerify();
          }
        });

        cancelButton?.addEventListener('click', () => {
          modal.remove();
          resolve(false);
        });

        setTimeout(() => codeInput?.focus(), 100);
      });
    } catch (error) {
      console.error('Password update error:', error);
      alert(error instanceof Error ? error.message : i18n.t('updateError'));
      return false;
    }
  }

  private async handleInfoUpdate(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    let changesCount = 0;
    if (username !== this.user.username) changesCount++;
    if (email !== this.user.email) changesCount++;
    if (password) changesCount++;

    if (changesCount > 1) {
      alert(i18n.t('updateOneAtTime'));
      return;
    }

    if (username !== this.user.username) {
      await this.handleUsernameUpdate(username);
    } else if (email !== this.user.email) {
      await this.handleEmailUpdate(email);
    } else if (password) {
      await this.handlePasswordUpdate(password);
    }
  }

  private updateView() {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = this.render();
      this.setupEventListeners();
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

                <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  ${i18n.t('updateOneAtTime')}
                </p>

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