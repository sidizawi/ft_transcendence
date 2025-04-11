import { User } from '../../shared/types/user';
import { GoogleAuth } from '../../shared/utils/googleAuth';
import { i18n } from '../../shared/i18n';
import { TokenManager } from '../../shared/utils/token';
import { TwoFactorAuth } from '../../shared/utils/twoFactorAuth';

const host = window.location.hostname;
const AUTH_API_URL = `http://${host}:3000/auth`;

export class Auth {
  constructor(private onLogin: (user: User) => void) {
    GoogleAuth.initialize(this.handleGoogleResponse.bind(this));
  }

  private async handleGoogleResponse(response: any) {
    try {
      const credential = response.credential;
      
      const backendResponse = await fetch(`${AUTH_API_URL}/google/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id_token: credential }),
        credentials: 'include'
      });

      if (!backendResponse.ok) {
        throw new Error('Google authentication failed');
      }

      const data = await backendResponse.json();
      TokenManager.setToken(data.token);
      
      const user = TokenManager.getUserFromToken();
      if (!user) {
        throw new Error('Invalid user data in token');
      }

      if (user.twoFactorEnabled) {
        const validated = await this.handle2FAVerification();
        if (!validated) {
          TokenManager.removeToken();
          throw new Error('2FA validation failed');
        }
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      this.onLogin(user);
    } catch (error) {
      console.error('Error handling Google response:', error);
      this.showError(i18n.t('authError'));
    }
  }

  private async handleLogin(identifier: string, password: string) {
    try {
      if (!identifier || !password) {
        throw new Error('Login (email or username) and password are required');
      }

      const response = await fetch(`${AUTH_API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          login: identifier,
          password 
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Login failed');
      }

      const data = await response.json();
      TokenManager.setToken(data.token);
      
      const user = TokenManager.getUserFromToken();
      if (!user) {
        throw new Error('Invalid user data in token');
      }

      // Check if user has 2FA enabled
      if (user.twoFactorEnabled) {
        const validated = await this.handle2FAVerification();
        if (!validated) {
          TokenManager.removeToken();
          throw new Error('2FA validation failed');
        }
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      this.onLogin(user);
    } catch (error) {
      console.error('Login error:', error);
      this.showError(error instanceof Error ? error.message : i18n.t('loginError'));
    }
  }

  private async handle2FAVerification(): Promise<boolean> {
    try {
      // Request OTP to be sent
      const sendResponse = await fetch(`${AUTH_API_URL}/2fa/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TokenManager.getToken()}`
        },
        body: JSON.stringify({ action: 'enable' }),
        credentials: 'include'
      });

      if (!sendResponse.ok) {
        throw new Error('Failed to send 2FA code');
      }

      // Show verification modal and handle verification
      return new Promise((resolve) => {
        const modal = this.create2FAModal();
        const form = modal.querySelector('form');
        const input = modal.querySelector('input');
        const messageDiv = modal.querySelector('#verification-message');

        form?.addEventListener('submit', async (e) => {
          e.preventDefault();
          const otp = input?.value.trim();

          if (!otp) {
            this.show2FAError(messageDiv, 'Please enter the verification code');
            return;
          }

          try {
            const verifyResponse = await fetch(`${AUTH_API_URL}/2fa/connection/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TokenManager.getToken()}`
              },
              body: JSON.stringify({ otp }),
              credentials: 'include'
            });

            if (!verifyResponse.ok) {
              const data = await verifyResponse.json();
              throw new Error(data.error || 'Verification failed');
            }

            modal.remove();
            resolve(true);
          } catch (error) {
            console.error('2FA verification error:', error);
            this.show2FAError(messageDiv, error instanceof Error ? error.message : 'Verification failed');
            input?.focus();
          }
        });

        // Handle cancel button
        const cancelBtn = modal.querySelector('#cancel-2fa');
        cancelBtn?.addEventListener('click', () => {
          modal.remove();
          resolve(false);
        });
      });
    } catch (error) {
      console.error('2FA verification error:', error);
      return false;
    }
  }

  private create2FAModal(): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          ${i18n.t('2FAVerification')}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          ${i18n.t('checkEmailForCode')}
        </p>
        <form class="space-y-4">
          <div>
            <input 
              type="text" 
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange dark:focus:ring-nature focus:border-transparent"
              placeholder="000000"
              maxlength="6"
              pattern="[0-9]*"
              inputmode="numeric"
              autocomplete="one-time-code"
              required
            >
          </div>
          <div id="verification-message" class="hidden"></div>
          <div class="flex justify-end space-x-3">
            <button 
              type="button"
              id="cancel-2fa"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ${i18n.t('cancel')}
            </button>
            <button 
              type="submit"
              class="px-4 py-2 bg-orange dark:bg-nature text-white dark:text-nature-lightest rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90"
            >
              ${i18n.t('verify')}
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  private show2FAError(messageDiv: Element | null, message: string) {
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
      messageDiv.classList.remove('hidden');
    }
  }

  private showError(message: string) {
    const signMessage = document.getElementById('sign-message');
    if (signMessage) {
      signMessage.textContent = message;
      signMessage.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
      signMessage.classList.remove('hidden');
    }
  }

  private getEyeIcon(isVisible: boolean): string {
    return isVisible ? `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ` : `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    `;
  }

  private async handleSignUp(username: string, email: string, password: string) {
    try {
      if (!username || !email || !password) {
        throw new Error('Username, email, and password are required');
      }

      const response = await fetch(`${AUTH_API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Signup failed');
      }

      const data = await response.json();
      TokenManager.setToken(data.token);
      
      const user = TokenManager.getUserFromToken();
      if (!user) {
        throw new Error('Invalid user data in token');
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      this.onLogin(user);
    } catch (error) {
      console.error('Signup error:', error);
      this.showError(error instanceof Error ? error.message : i18n.t('signupError'));
    }
  }

  renderSignIn(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-md">
          <p class="text-right mb-4 text-gray-600 dark:text-gray-400">
            ${i18n.t('newHere')}
            <a href="/signup" class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white ml-2">${i18n.t('createAccount')}</a>
          </p>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">${i18n.t('signIn')}</h2>
            
            <form id="signIn-form" class="space-y-4">
              <div>
                <label for="user-identifier" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ${i18n.t('username')} or ${i18n.t('email')}
                </label>
                <input 
                  type="text" 
                  id="user-identifier"
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ${i18n.t('password')}
                </label>
                <div class="relative">
                  <input 
                    type="password" 
                    id="password"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    required
                  >
                  <button 
                    type="button"
                    id="toggle-password"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    ${this.getEyeIcon(false)}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                class="w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-2 px-4 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors mt-6"
              >
                ${i18n.t('signIn')}
              </button>
            </form>

            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">${i18n.t('continueWith')}</span>
                </div>
              </div>

              <div id="google-signin-button" class="mt-6"></div>
            </div>

            <div id="sign-message" class="mt-4 p-4 rounded-lg hidden"></div>
          </div>
        </div>
      </div>
    `;
  }

  renderSignUp(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-md">
          <p class="text-right mb-4 text-gray-600 dark:text-gray-400">
            ${i18n.t('alreadyHaveAccount')}
            <a href="/signin" class="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white ml-2">${i18n.t('signIn')}</a>
          </p>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">${i18n.t('createAccount')}</h2>
            
            <form id="signUp-form" class="space-y-4">
              <div>
                <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ${i18n.t('username')}
                </label>
                <input 
                  type="text" 
                  id="username"
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ${i18n.t('email')}
                </label>
                <input 
                  type="email" 
                  id="email"
                  class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ${i18n.t('password')}
                </label>
                <div class="relative">
                  <input 
                    type="password" 
                    id="password"
                    class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                    required
                  >
                  <button 
                    type="button"
                    id="toggle-password"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  >
                    ${this.getEyeIcon(false)}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                class="w-full bg-orange dark:bg-nature text-white dark:text-nature-lightest py-2 px-4 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors mt-6"
              >
                ${i18n.t('signUp')}
              </button>
            </form>

            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">${i18n.t('continueWith')}</span>
                </div>
              </div>

              <div id="google-signin-button" class="mt-6"></div>
            </div>

            <div id="sign-message" class="mt-4 p-4 rounded-lg hidden"></div>
          </div>
        </div>
      </div>
    `;
  }

  setupAuthEventListeners(isSignUp: boolean) {
    const form = document.getElementById(isSignUp ? 'signUp-form' : 'signIn-form') as HTMLFormElement;
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    if (!form || !togglePassword || !passwordInput) return;

    togglePassword.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      togglePassword.innerHTML = this.getEyeIcon(isPassword);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      if (isSignUp) {
        const usernameInput = document.getElementById('username') as HTMLInputElement;
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        
        if (usernameInput && emailInput && passwordInput) {
          await this.handleSignUp(
            usernameInput.value,
            emailInput.value,
            passwordInput.value
          );
        }
      } else {
        const identifierInput = document.getElementById('user-identifier') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        
        if (identifierInput && passwordInput) {
          await this.handleLogin(
            identifierInput.value,
            passwordInput.value
          );
        }
      }
    });

    GoogleAuth.renderButton('google-signin-button');
  }
}