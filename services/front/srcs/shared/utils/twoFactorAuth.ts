import { i18n } from '../i18n';
import { TokenManager } from './token';

export class TwoFactorAuth {
  static async enable(userId: string): Promise<{ success: boolean }> {
    try {
      // Request 2FA setup
      const setupResponse = await fetch('http://localhost:3001/2fa/email/setup', {
        method: 'POST',
        headers: TokenManager.getAuthHeaders(),
        credentials: 'include'
      });

      if (!setupResponse.ok) {
        const data = await setupResponse.json();
        throw new Error(data.error || 'Failed to setup 2FA');
      }

      // Verify the setup with email code
      const verified = await this.verifyEmailCode(userId);
      return { success: verified };
    } catch (error) {
      console.error('2FA enable error:', error);
      return { success: false };
    }
  }

  static async disable(userId: string): Promise<{ success: boolean }> {
    try {
      // Verify first, then disable
      const verified = await this.verifyEmailCode(userId);
      if (!verified) {
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      console.error('2FA disable error:', error);
      return { success: false };
    }
  }

  private static async verifyEmailCode(userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const modal = this.createModal(`
        <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            ${i18n.t('enter2FACode')}
          </h3>
          <p class="text-gray-600 dark:text-gray-400 mb-6">
            ${i18n.t('checkEmailForCode')}
          </p>
          <div class="mb-4">
            <input 
              type="text" 
              id="2fa-verification-code"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="000000"
              maxlength="6"
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
              class="px-4 py-2 bg-orange dark:bg-nature text-white dark:text-nature-lightest rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90"
            >
              ${i18n.t('verify')}
            </button>
          </div>
          <div id="verification-message" class="mt-4 hidden"></div>
        </div>
      `);

      const verifyButton = document.getElementById('verify-2fa-code');
      const cancelButton = document.getElementById('cancel-2fa-verification');
      const codeInput = document.getElementById('2fa-verification-code') as HTMLInputElement;

      verifyButton?.addEventListener('click', async () => {
        const otp = codeInput.value;
        const response = await fetch('http://localhost:3001/2fa/email/verify', {
          method: 'POST',
          headers: TokenManager.getAuthHeaders(),
          credentials: 'include',
          body: JSON.stringify({ otp })
        });

        if (response.ok) {
          modal.remove();
          resolve(true);
        } else {
          const data = await response.json();
          this.showError(data.error || i18n.t('invalid2FACode'));
        }
      });

      cancelButton?.addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });
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