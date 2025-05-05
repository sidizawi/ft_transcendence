import { i18n } from '../i18n';
import { TokenManager } from './token';
import { SVGIcons } from '../../shared/components/svg';

const host = window.location.hostname;
const AUTH_API_URL = `http://${host}:3000/auth/2fa`;

export class TwoFactorAuth {
  static async enable(): Promise<{ success: boolean }> {
    try {
      // Request 2FA setup
      const setupResponse = await fetch(`${AUTH_API_URL}/email/send`, {
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
      const verified = await this.verifyEmailCode('switch');
      return { success: verified };
    } catch (error) {
      console.error('2FA enable error:', error);
      return { success: false };
    }
  }

  static async disable(): Promise<{ success: boolean }> {
    try {
      // Request 2FA disable setup
      const setupResponse = await fetch(`${AUTH_API_URL}/email/send`, {
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
      const verified = await this.verifyEmailCode('switch');
      return { success: verified };
    } catch (error) {
      console.error('2FA disable error:', error);
      return { success: false };
    }
  }

  static async login2FA(): Promise<{ success: boolean }> {
    try {
      // Request 2FA login verification
      const setupResponse = await fetch(`${AUTH_API_URL}/email/send`, {
        method: 'POST',
        headers: TokenManager.getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ action: 'login' })
      });

      if (!setupResponse.ok) {
        const data = await setupResponse.json();
        throw new Error(data.error || 'Failed to setup 2FA login');
      }

      // Verify the login with email code
      const verified = await this.verifyEmailCode('connection');
      return { success: verified };
    } catch (error) {
      console.error('2FA login error:', error);
      return { success: false };
    }
  }

  private static async verifyEmailCode(type: 'switch' | 'connection'): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = this.createModal(`
        <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-light-0 dark:bg-dark-4 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 class="text-xl text-center font-bold mb-4 text-light-4 dark:text-dark-0">
              ${i18n.t('verification2FA')}
            </h3>
            <p class="text-light-4/80 dark:text-dark-0/80 mb-6">
              ${i18n.t('checkEmailForCode')}
            </p>
            <div class="mb-4">
              <input 
                type="text" 
                id="2fa-verification-code"
                class="
                  mt-1 block w-full
                  rounded-md

                  border border-light-4/30
                  dark:border-dark-0/30
                  bg-white <!-- why not working>
                  dark:bg-dark-4
                  
                  placeholder-light-4/40
                  dark:placeholder-dark-0/40
                  text-light-4
                  dark:text-dark-0

                  focus:outline-none

                  focus:border-light-3
                  dark:focus:border-dark-1
                  focus:ring-2
                  focus:ring-light-0
                  dark:focus:ring-dark-4

                  px-3 py-2

                  text-base
                "
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
                class="px-4 py-2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0"
              >
                ${i18n.t('cancel')}
              </button>
              <button 
                id="verify-2fa-code"
                class="px-4 py-2 bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 relative"
                disabled
              >
                <span class="verify-text">${i18n.t('verify')}</span>
                <span class="loading-spinner hidden">
                  ${SVGIcons.getLoadingIcon()}
                </span>
              </button>
            </div>
            <div id="verification-message" class="mt-4 hidden"></div>
          </div>
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

          const endpoint = type === 'switch' ? 'switch/verify' : 'connection/verify';
          const response = await fetch(`${AUTH_API_URL}/${endpoint}`, {
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
    modal.className = 'fixed inset-0 bg-opacity-50 flex items-center justify-center z-50';
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