import { User } from '../../shared/types/user';
import { GoogleAuth } from '../../shared/utils/googleAuth';
import { i18n } from '../../shared/i18n';
import { TokenManager } from '../../shared/utils/token';
import { TwoFactorAuth } from '../../shared/utils/twoFactorAuth';
import { SVGIcons } from '../../shared/components/svg';

const host = window.location.hostname;
const AUTH_API_URL = `http://${host}:3000/auth`;
const USER_API_URL = `http://${host}:3000/user`;

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
      
      // Fetch user profile after successful authentication
      await this.fetchAndSetUserProfile();
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
      
      // Fetch user profile after successful login
      await this.fetchAndSetUserProfile();
    } catch (error) {
      this.showError(error instanceof Error ? error.message : i18n.t('loginError'));
    }
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
      
      // Fetch user profile after successful registration
      await this.fetchAndSetUserProfile();
    } catch (error) {
      this.showError(error instanceof Error ? error.message : i18n.t('signupError'));
    }
  }

  private async fetchAndSetUserProfile() {
    try {
      const response = await fetch(`${USER_API_URL}/profile`, {
        method: 'GET',
        headers: TokenManager.getAuthHeaders(),
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const profile = await response.json();
      if (!profile) {
        throw new Error('Profile data not found in response');
      }

      const user: User = {
        id: TokenManager.getUserFromToken()?.id || '',
        username: profile.username,
        email: profile.email,
        avatar: profile.avatar || '/img/default-avatar.jpg',
        twoFactorEnabled: profile.is_two_factor_enabled,
        google: profile.google,
        stats: {
          pong: {
            wins: 0,
            losses: 0,
            totalGames: 0,
            winRate: 0
          },
          connect4: {
            wins: 0,
            losses: 0,
            totalGames: 0,
            winRate: 0
          }
        }
      };

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(user));

      if (user.twoFactorEnabled) {
        const validated = await TwoFactorAuth.login2FA();
        if (!validated.success) {
          TokenManager.removeToken();
          localStorage.removeItem('user');
          throw new Error('2FA validation failed');
        }
      }

      this.onLogin(user);
    } catch (error) {
      TokenManager.removeToken();
      localStorage.removeItem('user');
      throw error;
    }
  }

  private showError(message: string) {
    const signMessage = document.getElementById('sign-message');
    if (signMessage) {
      signMessage.textContent = message;
      signMessage.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 text-center dark:text-red-400';
      signMessage.classList.remove('hidden');
    }
  }

  renderSignIn(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-md">
          <p class="text-right mb-4 text-sm text-light-4/80 dark:text-dark-0/80">
            ${i18n.t('newHere')}
            <a href="/signup" class="text-base text-light-4 dark:text-dark-0 hover:text-light-4 dark:hover:text-dark-0 ml-2">${i18n.t('createAccount')}</a>
          </p>

          <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-light-4 dark:text-dark-0">${i18n.t('signIn')}</h2>
            
            <form id="signIn-form" class="space-y-4">
              <div>
                <label for="user-identifier" class="block text-base font-medium text-light-4 dark:text-dark-0 mb-1">
                  ${i18n.t('username')} ${i18n.t('or')} ${i18n.t('email')}
                </label>
                <input 
                  type="text" 
                  id="user-identifier"
                  class="
                  mt-1 block w-full
                  rounded-md

                  border border-light-4/30
                  dark:border-dark-0/30
                  dark:bg-dark-4 <!-- pas de bg light -->
                  
                  text-light-4
                  dark:text-dark-0

                  focus:outline-none

                  focus:border-light-3
                  dark:focus:border-dark-1
                  focus:ring-2
                  focus:ring-light-0
                  dark:focus:ring-dark-4

                  px-3 py-2

                  text-sm
                "
                >
              </div>

              <div>
                <label for="password" class="block text-base font-medium text-light-4 dark:text-dark-0 mb-1">
                  ${i18n.t('password')}
                </label>
                <div class="relative">
                  <input 
                    type="password" 
                    id="password"
                    class="
                      mt-1 block w-full
                      rounded-md

                      border border-light-4/30
                      dark:border-dark-0/30
                      dark:bg-dark-4 <!-- pas de bg light -->
                      
                      text-light-4
                      dark:text-dark-0

                      focus:outline-none

                      focus:border-light-3
                      dark:focus:border-dark-1
                      focus:ring-2
                      focus:ring-light-0
                      dark:focus:ring-dark-4

                      px-3 py-2

                      text-sm
                    "
                  >
                  <button 
                    type="button"
                    id="toggle-password"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0"
                  >
                    ${SVGIcons.getEyeIcon(false)}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                class="w-full bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 py-2 px-4 rounded-lg hover:bg-light-4 dark:hover:bg-dark-1/90 transition-colors mt-6"
              >
                ${i18n.t('signIn')}
              </button>
            </form>

            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-light-2 dark:border-dark-2"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-light-0 dark:bg-dark-4 text-light-2 dark:text-dark-2">${i18n.t('or')}</span>
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
          <p class="text-right mb-4 text-sm text-light-4/80 dark:text-dark-4/80">
            ${i18n.t('alreadyHaveAccount')}
            <a href="/signin" class="text-base text-light-4 dark:text-dark-4 hover:text-light-4 dark:hover:text-dark-4 ml-2">${i18n.t('signIn')}</a>
          </p>

          <div class="bg-light-0 dark:bg-dark-0 rounded-lg shadow-lg p-8">
            <h2 class="text-2xl font-bold text-center mb-6 text-light-4 dark:text-dark-4">${i18n.t('createAccount')}</h2>
            
            <form id="signUp-form" class="space-y-4">
              <div>
                <label for="username" class="block text-base font-medium text-light-4 dark:text-dark-4 mb-1">
                  ${i18n.t('username')}
                </label>
                <input 
                  type="text" 
                  id="username"
                  class="
                    mt-1 block w-full
                    rounded-md

                    border border-light-4/30
                    dark:border-dark-4/30
                    dark:bg-dark-4/0.01 <!-- pas de bg light -->
                    
                    text-light-4
                    dark:text-dark-4

                    focus:outline-none

                    focus:border-light-3
                    dark:focus:border-dark-3
                    focus:ring-2
                    focus:ring-light-0
                    dark:focus:ring-dark-0

                    px-3 py-2

                    text-sm
                  "                  
                >
              </div>

              <div>
                <label for="email" class="block text-base font-medium text-light-4 dark:text-dark-4 mb-1">
                  ${i18n.t('email')}
                </label>
                <input 
                  type="email" 
                  id="email"
                  class="
                    mt-1 block w-full
                    rounded-md

                    border border-light-4/30
                    dark:border-dark-4/30
                    dark:bg-dark-4/0.01 <!-- pas de bg light -->
                    
                    text-light-4
                    dark:text-dark-4

                    focus:outline-none

                    focus:border-light-3
                    dark:focus:border-dark-3
                    focus:ring-2
                    focus:ring-light-0
                    dark:focus:ring-dark-0

                    px-3 py-2

                    text-sm
                  "                                    
                >
              </div>

              <div>
                <label for="password" class="block text-base font-medium text-light-4 dark:text-dark-4 mb-1">
                  ${i18n.t('password')}
                </label>
                <div class="relative">
                  <input 
                    type="password" 
                    id="password"
                    class="
                      mt-1 block w-full
                      rounded-md

                      border border-light-4/30
                      dark:border-dark-4/30
                      dark:bg-dark-4/0.01 <!-- pas de bg light -->
                      
                      text-light-4
                      dark:text-dark-4
                      
                      focus:outline-none

                      focus:border-light-3
                      dark:focus:border-dark-3
                      focus:ring-2
                      focus:ring-light-0
                      dark:focus:ring-dark-0

                      px-3 py-2

                      text-sm
                    "                                      
                  >
                  <button 
                    type="button"
                    id="toggle-password"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-light-4/80 dark:text-dark-4/80 hover:text-light-4 dark:hover:text-dark-4"
                  >
                    ${SVGIcons.getEyeIcon(false)}
                  </button>
                </div>
              </div>

                <div>
                  <label for="password" class="block text-base font-medium text-light-4 dark:text-dark-4 mb-1">
                    ${i18n.t('confirmPassword')}
                  </label>
                  <div class="relative">
                    <input 
                      type="password" 
                      id="confirmPassword"
                      class="
                        mt-1 block w-full
                        rounded-md

                        border border-light-4/30
                        dark:border-dark-4/30
                        dark:bg-dark-4/0.01 <!-- pas de bg light -->
                        
                        text-light-4
                        dark:text-dark-4
                        
                        focus:outline-none

                        focus:border-light-3
                        dark:focus:border-dark-3
                        focus:ring-2
                        focus:ring-light-0
                        dark:focus:ring-dark-0

                        px-3 py-2

                        text-sm
                      "
                    >
                    <button 
                      type="button"
                      id="toggle-confirm-password"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-light-4/80 dark:text-dark-4/80 hover:text-light-4 dark:hover:text-dark-4"
                    >
                      ${SVGIcons.getEyeIcon(false)}
                    </button>
                </div>

              </div>

              <button 
                type="submit"
                class="w-full bg-light-3 dark:bg-dark-3 text-white dark:text-black py-2 px-4 rounded-lg hover:bg-light-4 dark:hover:bg-dark-4 transition-colors mt-6"
              >
                ${i18n.t('signUp')}
              </button>
            </form>

            <div class="mt-6">
              <div class="relative">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-light-2 dark:border-dark-2"></div>
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-2 bg-light-0 dark:bg-dark-0 text-light-2 dark:text-dark-2">${i18n.t('or')}</span>
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
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;

    if (!form || !togglePassword || !passwordInput) return;

    // Password visibility toggle for main password
    togglePassword?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      if (togglePassword instanceof HTMLElement) {
        togglePassword.innerHTML = SVGIcons.getEyeIcon(isPassword);
      }
    });

    // Password visibility toggle for confirm password
    if (isSignUp && toggleConfirmPassword) {
      toggleConfirmPassword.addEventListener('click', () => {
        const isPassword = confirmPasswordInput.type === 'password';
        confirmPasswordInput.type = isPassword ? 'text' : 'password';
        if (toggleConfirmPassword instanceof HTMLElement) {
          toggleConfirmPassword.innerHTML = SVGIcons.getEyeIcon(isPassword);
        }
      });
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (isSignUp) {
        const usernameInput = document.getElementById('username') as HTMLInputElement;
        const emailInput = document.getElementById('email') as HTMLInputElement;
        const passwordInput = document.getElementById('password') as HTMLInputElement;
        const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;

        if (usernameInput && emailInput && passwordInput) {
          const username = usernameInput.value.trim(); //space allowed?
          const email = emailInput.value.trim();
          const password = passwordInput.value;
          const confirmPassword = confirmPasswordInput.value;

          if (!username && !email && !password && !confirmPassword) {
            this.showError(i18n.t('emptyAllFields'));
            return;
          }

          // Email regex pattern
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

          if (!username || username.includes(' ')) {
            this.showError(i18n.t('usernameFormatError'));
            return;
          }

          if (!email || !emailPattern.test(email)) {
            this.showError(i18n.t('emailFormatError'));
            return;
          }

          if (!password) {
            this.showError(i18n.t('emptyPassword'));
            return;
          }

          if (password !== confirmPassword) {
            this.showError(i18n.t('passwordMismatch'));
            return;
          }

          // // Password validation: minimum 8 characters, one uppercase, one special character
          // const passwordPattern = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>\/?]).{8,}$/;

          // if (!passwordPattern.test(password)) {
          //   this.showError(i18n.t('passwordStrengthError'));
          //   return;
          // }

          await this.handleSignUp(username, email, password);
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