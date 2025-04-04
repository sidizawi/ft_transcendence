import { i18n } from '../i18n';
import { TokenManager } from './token';

const host = window.location.hostname;
const AUTH_API_URL = `http://${host}:3000/auth`;

export class TwoFactorAuth {
  static async enable(userId: string): Promise<{ success: boolean }> {
    try {
      // Request 2FA setup
      const setupResponse = await fetch(`${AUTH_API_URL}/2fa/email/send`, {
        method: 'POST',
        headers: TokenManager.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action: 'enable' })
      });

      if (!setupResponse.ok) {
        const data = await setupResponse.json();
        throw new Error(data.error || 'Failed to setup 2FA');
      }

      // Verify the setup with email code
      const verified = await this.verifyEmailCode();
      return { success: verified };
    } catch (error) {
      console.error('2FA enable error:', error);
      return { success: false };
    }
  }

  static async disable(userId: string): Promise<{ success: boolean }> {
    try {
      // Request 2FA disable setup
      const setupResponse = await fetch(`${AUTH_API_URL}/2fa/email/send`, {
        method: 'POST',
        headers: TokenManager.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action: 'disable' })
      });

      if (!setupResponse.ok) {
        const data = await setupResponse.json();
        throw new Error(data.error || 'Failed to setup 2FA disable');
      }

      // Verify the code to disable 2FA
      const verified = await this.verifyEmailCode();
      return { success: verified };
    } catch (error) {
      console.error('2FA disable error:', error);
      return { success: false };
    }
  }

  private static async verifyEmailCode(): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = this.createModal(`
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            ${i18n.t('2FAVerification')}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            ${i18n.t('checkEmailForCode')}
          </p>
          <div class="mb-4">
            <input 
              type="text" 
              id="2fa-verification-code"
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
              id="cancel-2fa-verification"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ${i18n.t('cancel')}
            </button>
            <button 
              id="verify-2fa-code"
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
      `);

      const verifyButton = document.getElementById('verify-2fa-code') as HTMLButtonElement;
      const cancelButton = document.getElementById('cancel-2fa-verification');
      const codeInput = document.getElementById('2fa-verification-code') as HTMLInputElement;
      const loadingSpinner = modal.querySelector('.loading-spinner');
      const verifyText = modal.querySelector('.verify-text');

      const updateVerifyButton = () => {
        const code = codeInput.value.trim();
        verifyButton.disabled = !code || code.length !== 6 || !/^\d+$/.test(code);
      };

      const handleVerify = async () => {
        const otp = codeInput.value.trim();
        if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
          this.showError(i18n.t('invalid2FACode'));
          return;
        }

        try {
          verifyButton.disabled = true;
          loadingSpinner?.classList.remove('hidden');
          verifyText?.classList.add('hidden');

          const response = await fetch(`${AUTH_API_URL}/2fa/switch/verify`, {
            method: 'POST',
            headers: TokenManager.getAuthHeaders(),
            credentials: 'include',
            body: JSON.stringify({ otp })
          });

          if (response.ok) {
            const data = await response.json();
            // Update the token if a new one was provided
            if (data.token) {
              TokenManager.setToken(data.token);
            }
            modal.remove();
            resolve(true);
          } else {
            const data = await response.json();
            this.showError(data.error || i18n.t('invalid2FACode'));
            codeInput.value = '';
            codeInput.focus();
          }
        } catch (error) {
          console.error('Verification error:', error);
          this.showError(i18n.t('verificationError'));
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

      // Focus the input field
      setTimeout(() => codeInput?.focus(), 100);
    });
  }

  private static createModal(content: string): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = content;
    document.body.appendChild(modal);
    return modal;
  }

  private static showError(message: string) {
    const messageDiv = document.getElementById('verification-message');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
      messageDiv.classList.remove('hidden');
    }
  }
}