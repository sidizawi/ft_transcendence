import { User } from '../../shared/types/user';
import { i18n } from '../../shared/i18n';
import { TokenManager } from '../../shared/utils/token';
import { AvatarService } from '../../shared/services/avatarService';
// import { Profile } from './profile';

const host = window.location.hostname;
const USER_API_URL = `https://${host}:8080/api/user/settings`;
const PROFILE_API_URL = `https://${host}:8080/api/user/profile`;

export class Settings {
  constructor(private user: User) {}

  private updateView() {
    // window.history.pushState({}, '', '/profile'); //show avatar dans settings, mais fait tout planter
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = this.render();
      this.setupEventListeners();
    }
    // const main = document.querySelector('main');
    // if (main) {
    //   const profile = new Profile(this.state.user, () => this.handleLogout());
    //   main.innerHTML = profile.render();
    //   profile.setupEventListeners();
    // }
  }

  private async fetchAndUpdateUserProfile() {
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

      // Update user data
      this.user = {
        ...this.user,
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar || '/img/default-avatar.jpg',
        twoFactorEnabled: profile.is_two_factor_enabled,
        google: profile.google || false,
        stats: this.user.stats // Keep existing stats
      };

      localStorage.setItem('user', JSON.stringify(this.user));
      
      this.updateView();
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  private async handleAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      await AvatarService.uploadAvatar(file);
      await this.fetchAndUpdateUserProfile();
    } catch (error) {
      console.error('Avatar upload error:', error);
      throw new Error(error || i18n.t('uploadAvatar'));
    }
  }

  private async handleInfoUpdate(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
  
    const newUsername = formData.get('username') as string;
    const newEmail = !this.user.google ? formData.get('email') as string : null;
    const newPassword = !this.user.google ? formData.get('password') as string : '';
    // const confirmPassword = !this.user.google ? formData.get('confirmPassword') as string : '';

    // // For non-Google users, validate the password.
    // if (!this.user.google && newPassword && newPassword !== confirmPassword) {
    //   this.showVerificationError(messageDiv, i18n.t('passwordMismatch'));
    //   return;
    // }
  
    const payload: {
      newUsername?: string;
      newEmail?: string;
      newPassword?: string;
    } = {};
  
    if (newUsername && newUsername !== this.user.username) {
      payload.newUsername = newUsername;
    }
    if (!this.user.google) {
      if (newEmail && newEmail !== this.user.email) {
        payload.newEmail = newEmail;
      }
      if (newPassword) {
        payload.newPassword = newPassword;
      }
    }
  
    if (Object.keys(payload).length === 0)
      return;
  

    if (Object.keys(payload).length === 1 && payload.newUsername) {
      try {
        const response = await fetch(`${USER_API_URL}/username`, {
          method: 'PUT',
          headers: TokenManager.getAuthHeaders(),
          body: JSON.stringify({ newUsername: payload.newUsername })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || i18n.t('updateError'));
        }

        const data = await response.json();
        TokenManager.setToken(data.token);
        
        await this.fetchAndUpdateUserProfile();
        window.location.href = '/profile'; //ce qui cause reload
        return true;
      } catch (error) {
        console.error('Username update error:', error);
        throw error;
      }
    }


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
  
      return new Promise((resolve) => {
        const modal = this.createVerificationModal(i18n.t('emailVerification'));
        const verifyButton = document.getElementById('verify-code') as HTMLButtonElement;
        const cancelButton = document.getElementById('cancel-verification');
        const codeInput = document.getElementById('verification-code') as HTMLInputElement;
        const messageDiv = document.getElementById('verification-message');

        const handleVerify = async () => {
          const code = codeInput.value.trim();
          if (!code || code.length !== 6 || !/^\d+$/.test(code)) {
            this.showVerificationError(messageDiv, i18n.t('invalid2FACode'));
            return;
          }

          try {
            const verifyResponse = await fetch(`${USER_API_URL}/update-confirm`, {
              method: 'PUT',
              headers: TokenManager.getAuthHeaders(),
              body: JSON.stringify({ verificationCode: code })
            });

            if (verifyResponse.ok) {
              const data = await verifyResponse.json();
              TokenManager.setToken(data.token);
              
              await this.fetchAndUpdateUserProfile();
              // window.location.href = '/profile'; //ce qui cause reload
              modal.remove();
              resolve(true);
            } else {
              const data = await verifyResponse.json();
              this.showVerificationError(messageDiv, data.error || i18n.t('invalid2FACode'));
              codeInput.value = '';
              codeInput.focus();
            }
          } catch (error) {
            console.error('Email verification error:', error);
            this.showVerificationError(messageDiv, i18n.t('verificationError'));
          }
        };
  
        codeInput?.addEventListener('input', () => {
          const code = codeInput.value.trim();
          verifyButton.disabled = !code || code.length !== 6 || !/^\d+$/.test(code);
        });

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
      });
    } catch (error) {
      console.error('Email update error:', error);
      throw error;
    }
  }
  
  private async handleDeleteAccount() {
    // First step: Show password confirmation modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          ${i18n.t('deleteAccountVerification')}
        </h3>
        <p class="text-red-600 dark:text-red-400 mb-4">
          ${i18n.t('deleteAccountWarning')}
        </p>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          ${i18n.t('deleteAccountConfirm')}
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ${i18n.t('enterPassword')}
          </label>
          <input 
            type="password" 
            id="delete-account-password"
            class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
        </div>
        <div class="flex justify-end space-x-4">
          <button 
            id="cancel-delete"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ${i18n.t('cancel')}
          </button>
          <button 
            id="confirm-delete"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ${i18n.t('deleteAccount')}
          </button>
        </div>
        <div id="delete-account-error" class="mt-4 hidden"></div>
      </div>
    `;
    document.body.appendChild(modal);

    const cancelButton = modal.querySelector('#cancel-delete');
    const confirmButton = modal.querySelector('#confirm-delete');
    const passwordInput = modal.querySelector('#delete-account-password') as HTMLInputElement;
    const errorDiv = modal.querySelector('#delete-account-error');

    const showError = (message: string) => {
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
        errorDiv.classList.remove('hidden');
      }
    };

    cancelButton?.addEventListener('click', () => {
      modal.remove();
    });

    confirmButton?.addEventListener('click', async () => {
      try {
        const requestResponse = await fetch(`${USER_API_URL}/delete/request`, {
          method: 'POST',
          headers: TokenManager.getAuthHeaders(),
          body: JSON.stringify({ password: passwordInput.value })
        });

        if (!requestResponse.ok) {
          const data = await requestResponse.json();
          showError(data.error || i18n.t('deleteAccountError'));
          return;
        }

        // Show verification code modal
        modal.remove();
        const verificationModal = document.createElement('div');
        verificationModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        verificationModal.innerHTML = `
          <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              ${i18n.t('deleteAccountVerification')}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 mb-6">
              ${i18n.t('checkEmailForCode')}
            </p>
            <div class="mb-4">
              <input 
                type="text" 
                id="verification-code"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ${i18n.t('verify')}
              </button>
            </div>
            <div id="verification-error" class="mt-4 hidden"></div>
          </div>
        `;
        document.body.appendChild(verificationModal);

        const verifyButton = verificationModal.querySelector('#verify-code');
        const cancelVerification = verificationModal.querySelector('#cancel-verification');
        const codeInput = verificationModal.querySelector('#verification-code') as HTMLInputElement;
        const verificationError = verificationModal.querySelector('#verification-error');

        const showVerificationError = (message: string) => {
          if (verificationError) {
            verificationError.textContent = message;
            verificationError.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
            verificationError.classList.remove('hidden');
          }
        };

        cancelVerification?.addEventListener('click', () => {
          verificationModal.remove();
        });

        verifyButton?.addEventListener('click', async () => {
          try {
            const verificationCode = codeInput.value.trim();
            
            if (!verificationCode || verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
              showVerificationError(i18n.t('invalid2FACode'));
              return;
            }

            const deleteResponse = await fetch(`${USER_API_URL}/delete/confirm`, {
              method: 'DELETE',
              headers: TokenManager.getAuthHeaders(),
              body: JSON.stringify({ verificationCode })
            });

            if (deleteResponse.ok) {
              TokenManager.removeToken();
              localStorage.removeItem('user');
              window.location.href = '/signin';
            } else {
              const data = await deleteResponse.json();
              showVerificationError(data.error || i18n.t('deleteAccountError'));
            }
          } catch (error) {
            console.error('Account deletion error:', error);
            showVerificationError(i18n.t('deleteAccountError'));
          }
        });

      } catch (error) {
        console.error('Delete account error:', error);
        showError(i18n.t('deleteAccountError'));
      }
    });
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
            ${i18n.t('verify')}
          </button>
        </div>
        <div id="verification-message" class="mt-4 hidden"></div>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  private showVerificationError(messageDiv: Element | null, message: string) {
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
      messageDiv.classList.remove('hidden');
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
                    alt="${i18n.t('avatar')}" 
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
                    placeholder="${this.user.username}"
                    class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                ${!this.user.google ? `
                  <div>
                    <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ${i18n.t('email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="${this.user.email}"
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

                  <div>
                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ${i18n.t('confirmPassword')}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="••••••••"
                      class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                ` : `
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      ${i18n.t('email')}
                    </label>
                    <div class="mt-1 block w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                      ${this.user.email}
                      <span class="ml-2 text-xs">(${i18n.t('googleAccount')})</span>
                    </div>
                  </div>
                `}

                <div class="flex flex-col space-y-4 pt-6">
                  <button
                    type="button"
                    id="deleteAccountBtn"
                    class="w-full px-6 py-2 border border-red-500 dark:border-red-600 text-red-500 dark:text-red-400 rounded-md shadow-sm text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    ${i18n.t('deleteAccount')}
                  </button>

                  <div class="flex justify-center space-x-4">
                    <a
                      href="/profile"
                      class="px-6 py-2 bg-orange-lighter dark:bg-forest text-orange-darker dark:text-nature-lightest rounded-lg hover:bg-orange-lighter/90 dark:hover:bg-forest/90 transition-colors"
                    >
                      ${i18n.t('back')}
                    </a>
                    <button
                      type="submit"
                      class="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-orange dark:bg-nature hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors"
                    >
                      ${i18n.t('saveChanges')}
                    </button>
                  </div>
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
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');

    avatarUpload?.addEventListener('change', (e) => this.handleAvatarChange(e));
    updateForm?.addEventListener('submit', (e) => this.handleInfoUpdate(e));
    deleteAccountBtn?.addEventListener('click', () => this.handleDeleteAccount());

    // Add password confirmation validation
    if (!this.user.google) {
      const validatePasswords = () => {
        if (passwordInput.value && confirmPasswordInput.value) {
          if (passwordInput.value !== confirmPasswordInput.value) {
            confirmPasswordInput.setCustomValidity(i18n.t('passwordMismatch'));
          } else {
            confirmPasswordInput.setCustomValidity('');
          }
        } else {
          confirmPasswordInput.setCustomValidity('');
        }
      };

      passwordInput?.addEventListener('input', validatePasswords);
      confirmPasswordInput?.addEventListener('input', validatePasswords);
    }
  }
}