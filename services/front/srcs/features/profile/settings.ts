import { User } from '../../shared/types/user';
import { i18n } from '../../shared/i18n';
import { AvatarService } from '../../shared/services/avatarService';
import { AccountService } from '../../shared/services/accountService';
import { SVGIcons } from '../../shared/components/svg';

export class Settings {
  constructor(private user: User) {}

  private updateView() {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = this.render();
      this.setupEventListeners();
    }
    window.location.href = '/profile';
  }

  private async handleAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      await AvatarService.uploadAvatar(file);
      this.user = await AccountService.fetchAndUpdateUserProfile();
      this.updateView();
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
    const confirmPassword = !this.user.google ? formData.get('confirmPassword') as string : '';
  
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
        if (confirmPassword && newPassword === confirmPassword) {
          try {
            const matches = await AccountService.checkPassword(newPassword);
            if (matches) {
              this.showError(i18n.t('samePasswordError'));
              return;
            }
            payload.newPassword = newPassword;
          } catch (error) {
            console.error('Password check error:', error);
            this.showError(i18n.t('updateError'));
            return;
          }
        } else if (confirmPassword && newPassword !== confirmPassword) {
          this.showError(i18n.t('passwordMismatch'));
          return;
        } else {
          this.showError(i18n.t('emptyPassword'));
          return;
        }
      } else if (!newPassword && confirmPassword) {
        this.showError(i18n.t('emptyPassword'));
        return;
      }
    }
  
    if (Object.keys(payload).length === 0) return;
  
    try {
      if (Object.keys(payload).length === 1 && payload.newUsername) {
        await AccountService.updateUsername(payload.newUsername);
        this.updateView();
        return;
      }
  
      const requestSuccess = await AccountService.requestProfileUpdate(payload);
      if (requestSuccess) {
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
            const success = await AccountService.confirmProfileUpdate(code);
            if (success) {
              modal.remove();
              this.updateView();
            }
          } catch (error) {
            this.showVerificationError(messageDiv, error instanceof Error ? error.message : i18n.t('verificationError'));
            codeInput.value = '';
            codeInput.focus();
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
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      this.showError(error instanceof Error ? error.message : i18n.t('updateError'));
    }
  }
    
  private async handleDeleteAccount() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = this.renderDeleteAccountModal();
    document.body.appendChild(modal);
  
    const cancelButton = modal.querySelector('#cancel-delete');
    const confirmButton = modal.querySelector('#confirm-delete');
    const usernameInput = modal.querySelector('#username') as HTMLInputElement;
    const passwordInput = modal.querySelector('#delete-account-password') as HTMLInputElement;
    const confirmPasswordInput = modal.querySelector('#confirmPassword') as HTMLInputElement;
    const toggleDeletePassword = modal.querySelector('#toggle-delete-password');
    const toggleConfirmPassword = modal.querySelector('#toggle-confirm-password');
    const errorDiv = modal.querySelector('#delete-account-error');
    
    const showError = (message: string) => {
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400';
        errorDiv.classList.remove('hidden');
      }
    };
  
    const hideError = () => {
      errorDiv?.classList.add('hidden');
    };
  
    // Hide error on input focus
    [usernameInput, passwordInput, confirmPasswordInput].forEach(input => {
      input?.addEventListener('focus', hideError);
    });
  
    toggleDeletePassword?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      if (toggleDeletePassword instanceof HTMLElement) {
        toggleDeletePassword.innerHTML = SVGIcons.getEyeIcon(isPassword);
      }
    });
  
    toggleConfirmPassword?.addEventListener('click', () => {
      const isPassword = confirmPasswordInput.type === 'password';
      confirmPasswordInput.type = isPassword ? 'text' : 'password';
      if (toggleConfirmPassword instanceof HTMLElement) {
        toggleConfirmPassword.innerHTML = SVGIcons.getEyeIcon(isPassword);
      }
    });
  
    cancelButton?.addEventListener('click', () => {
      modal.remove();
    });
  
    confirmButton?.addEventListener('click', async () => {
      try {
        // Verify all fields are completed
        if (!usernameInput.value || !passwordInput.value || !confirmPasswordInput.value) {
          showError(i18n.t('emptyAllFields'));
          return;
        }
  
        // Verify username matches
        if (usernameInput.value !== this.user.username) {
          showError(i18n.t('usernameFormatError'));
          return;
        }
  
        // Verify passwords match
        if (passwordInput.value !== confirmPasswordInput.value) {
          showError(i18n.t('passwordMismatch'));
          return;
        }
  
        const success = await AccountService.requestAccountDeletion(passwordInput.value);
        if (success) {
          modal.remove();
          const verificationModal = document.createElement('div');
          verificationModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
          verificationModal.innerHTML = this.renderVerificationModal(i18n.t('deleteAccountVerification'));
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
  
              const success = await AccountService.confirmAccountDeletion(verificationCode);
              if (success) {
                window.location.href = '/signin';
              }
            } catch (error) {
              showVerificationError(error instanceof Error ? error.message : i18n.t('deleteAccountError'));
            }
          });
        }
      } catch (error) {
        showError(error instanceof Error ? error.message : i18n.t('deleteAccountError'));
      }
    });
  }  

  private createVerificationModal(title: string): HTMLDivElement {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = this.renderVerificationModal(title);
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

  private showError(message: string) {
    const signMessage = document.getElementById('error-message');
    if (signMessage) {
      signMessage.textContent = message;
      signMessage.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 text-center dark:text-red-400';
      signMessage.classList.remove('hidden');
    }
  }

  render(): string {
    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="w-full max-w-2xl">
          <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg overflow-hidden">
            <div class="p-8">
              <!-- Avatar Section -->
              <div class="flex flex-col items-center mb-8">
                <div class="relative mb-4">
                  <img 
                    src="/${this.user.avatar}" 
                    alt="${i18n.t('avatar')}" 
                    class="w-32 h-32 rounded-full object-cover"
                  >
                  <label 
                    for="settings-avatar-upload" 
                    class="absolute bottom-0 right-0 bg-light-1 dark:bg-dark-3 p-2 rounded-full shadow-lg hover:bg-black dark:hover:bg-yellow transition-colors cursor-pointer"
                    title="${i18n.t('changePhoto')}"
                  >
                    ${SVGIcons.getCameraIcon()}
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
                  <label for="username" class="block text-base font-medium text-light-4 dark:text-dark-0">
                    ${i18n.t('username')}
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    placeholder="${this.user.username}"
                    class="
                      mt-1 block w-full rounded-md px-3 py-2 text-sm

                      border border-light-4/30
                      dark:border-dark-0/30
                      dark:bg-dark-4 <!-- pas de bg light -->
                      
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
                    "                                      
                  >
                </div>

                ${!this.user.google ? `
                  <div>
                    <label for="email" class="block text-base font-medium text-light-4 dark:text-dark-0">
                      ${i18n.t('email')}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      placeholder="${this.user.email}"
                      class="
                        mt-1 block w-full rounded-md px-3 py-2 text-sm

                        border border-light-4/30
                        dark:border-dark-0/30
                        dark:bg-dark-4 <!-- pas de bg light -->
                        
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
                      "                                   
                    >
                  </div>

                  <div>
                    <label for="password" class="block text-base font-medium text-light-4 dark:text-dark-0">
                      ${i18n.t('newPassword')}
                    </label>
                    <div class="relative">
                      <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="••••••••"
                        class="
                          mt-1 block w-full rounded-md px-3 py-2 text-sm

                          border border-light-4/30
                          dark:border-dark-0/30
                          dark:bg-dark-4 <!-- pas de bg light -->
                          
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

                  <div>
                    <label for="confirmPassword" class="block text-base font-medium text-light-4 dark:text-dark-0">
                      ${i18n.t('confirmPassword')}
                    </label>
                    <div class="relative">
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="••••••••"
                        class="
                          mt-1 block w-full rounded-md px-3 py-2 text-sm

                          border border-light-4/30
                          dark:border-dark-0/30
                          dark:bg-dark-4 <!-- pas de bg light -->
                          
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
                        "
                      >
                      <button 
                        type="button"
                        id="toggle-confirm-password"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0"
                      >
                        ${SVGIcons.getEyeIcon(false)}
                      </button>
                    </div>
                  </div>
                ` : `
                  <div>
                    <label class="block text-sm font-medium text-light-4 dark:text-dark-0">
                      ${i18n.t('email')}
                    </label>
                    <div class="mt-1 block w-full px-4 py-2 rounded-md bg-light-1 dark:bg-dark-3 text-light-4 dark:text-light-0">
                      ${this.user.email}
                      <span class="ml-2 text-xs">(${i18n.t('googleAccount')})</span>
                    </div>
                  </div>
                `}

                <div class="flex justify-center space-x-4">
                  <button
                    type="submit"
                    class="px-6 py-2 rounded-lg shadow-sm text-base font-medium text-light-0 dar:text-dark-4 bg-light-3 dark:bg-dark-1 hover:bg-light-4 dark:hover:bg-dark-0 transition-colors"
                  >
                    ${i18n.t('saveChanges')}
                  </button>
                </div>

                <div id="error-message" class="mt-4 p-4 rounded-lg hidden"></div>

                <div class="relative pt-4">
                  <div class="absolute top-1/2 right-0 transform -translate-y-1/2 inline-block group text-base">
                    <button
                      type="button"
                      id="deleteAccountBtn"
                      class="
                        rounded-lg p-2
                        flex items-center justify-center
                        text-off-btn-light-0 dark:text-off-btn-dark-0
                        hover:text-light-0 dark:hover:text-dark-4
                        hover:bg-off-btn-light-0 dark:hover:bg-off-btn-dark-0
                        transition-all         /* animate any change smoothly */
                        duration-200
                        transform              /* enable transforms */
                        hover:scale-110        /* optional: slight zoom on hover */
                      "
                    >
                      <!-- SVG: visible by default, hidden on hover -->
                      <span class="block group-hover:hidden">
                        ${SVGIcons.getDeleteIcon()}
                      </span>

                      <!-- Text: hidden by default, shown on hover -->
                      <span class="hidden group-hover:inline">
                        ${i18n.t('deleteAccount')}
                      </span>
                    </button>
                  </div>
                </div>

                  
              </form>
            </div>
          </div>
        </div>
        <!-- Back Button -->
        <div class="mt-8 flex justify-center">
          <button 
              id="backButton"
            class="px-6 py-2 rounded-lg text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0 transition-colors"
          >
            ${i18n.t('back')}
          </button>
        </div>
      </div>
    `;
  }

  private renderDeleteAccountModal(): string {
    return `
      <div class="bg-light-0 dark:bg-dark-4 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 class="text-xl text-center font-bold mb-4 text-light-4 dark:text-dark-0">
          ${i18n.t('deleteAccountVerification')}
        </h3>
        <div class="mb-6 mt-6">
          <p class="text-red-600 dark:text-red-400 ">
            ${i18n.t('deleteAccountWarning')}
          </p>
          <p class="text-light-4/80 dark:text-dark-0/80">
            ${i18n.t('deleteAccountConfirm')}
          </p>
        </div>
        <div class="mb-4">
          <div class="mb-4">
            <label for="username" class="block text-base font-medium text-light-4 dark:text-dark-0">
              ${i18n.t('username')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="${this.user.username}"
              class="
                mt-1 block w-full rounded-md px-3 py-2 text-sm

                border border-light-4/30
                dark:border-dark-0/30
                dark:bg-dark-4 <!-- pas de bg light -->
                
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
              "                                     
            >
          </div>
          <div class="mb-4">
            <label class="block text-base font-medium text-light-4 dark:text-dark-0">
              ${i18n.t('enterPassword')}
            </label>
            <div class="relative">
              <input 
                type="password" 
                id="delete-account-password"
                placeholder="••••••••"
                class="
                  mt-1 block w-full rounded-md px-3 py-2 text-sm

                  border border-light-4/30
                  dark:border-dark-0/30
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
                "
              >
              <button 
                type="button"
                id="toggle-delete-password"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0"
              >
                ${SVGIcons.getEyeIcon(false)}
              </button>
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-base font-medium text-light-4 dark:text-dark-0">
              ${i18n.t('confirmPassword')}
            </label>
            <div class="relative">
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="••••••••"
                class="
                  mt-1 block w-full rounded-md px-3 py-2 text-sm

                  border border-light-4/30
                  dark:border-dark-0/30
                  dark:bg-dark-4 <!-- pas de bg light -->
                  
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
                "
              >
              <button 
                type="button"
                id="toggle-confirm-password"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0"
              >
                ${SVGIcons.getEyeIcon(false)}
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-4">
          <button 
            id="cancel-delete"
            class="px-4 py-2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0"
          >
            ${i18n.t('cancel')}
          </button>
          <button 
            id="confirm-delete"
            class="
              px-4 py-2 rounded-lg transition-colors
              bg-off-btn-light-0 dark:bg-off-btn-dark-1
              text-light-0 dark:text-dark-4
              hover:bg-off-btn-light-1 dark:hover:bg-off-btn-dark-0
            "
          >
            ${i18n.t('deleteAccount')}
          </button>
        </div>
        <div id="delete-account-error" class="mt-4 hidden"></div>
      </div>
    `;
  }

  private renderVerificationModal(title: string): string {
    return `
      <div class="bg-light-0 dark:bg-dark-4 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <h3 class="text-xl font-bold mb-4 text-light-4 dark:text-dark-0">
          ${title}
        </h3>
        <p class="text-light-4/80 dark:text-dark-0/80 mb-6">
          ${i18n.t('checkEmailForCode')}
        </p>
        <div class="mb-4">
          <input 
            type="text" 
            id="verification-code"
            class="
              w-full px-4 py-2
              rounded-lg
              
              border border-light-4/30 dark:border-dark-0/30
              dark:bg-dark-3

              placeholder-light-4/40 dark:placeholder-dark-0/40
              text-light-4 dark:text-dark-0

              focus:outline-none

              focus:border-light-3 dark:focus:border-dark-1
              focus:ring-2
              focus:ring-light-0 dark:focus:ring-dark-4
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
            id="cancel-verification"
            class="px-4 py-2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0"
          >
            ${i18n.t('cancel')}
          </button>
          <button 
            id="verify-code"
            class="px-4 py-2 bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 relative"
            disabled
          >
            ${i18n.t('verify')}
          </button>
        </div>
        <div id="verification-message" class="mt-4 hidden"></div>
      </div>
    `;
  }

  setupEventListeners() {
    const avatarUpload = document.getElementById('settings-avatar-upload') as HTMLInputElement;
    const updateForm = document.getElementById('update-info-form');
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
    const togglePassword = document.getElementById('toggle-password');
    const toggleConfirmPassword = document.getElementById('toggle-confirm-password');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const errorMessage = document.getElementById('error-message');
  
    // Hide error message on input focus
    const inputs = updateForm?.querySelectorAll('input');
    inputs?.forEach(input => {
      input.addEventListener('focus', () => {
        errorMessage?.classList.add('hidden');
      });
    });
  
    avatarUpload?.addEventListener('change', (e) => this.handleAvatarChange(e));
    deleteAccountBtn?.addEventListener('click', () => this.handleDeleteAccount());
    
    // Password visibility toggle
    togglePassword?.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';
      if (togglePassword instanceof HTMLElement) {
        togglePassword.innerHTML = SVGIcons.getEyeIcon(isPassword);
      }
    });
  
    // Confirm password visibility toggle
    toggleConfirmPassword?.addEventListener('click', () => {
      const isPassword = confirmPasswordInput.type === 'password';
      confirmPasswordInput.type = isPassword ? 'text' : 'password';
      if (toggleConfirmPassword instanceof HTMLElement) {
        toggleConfirmPassword.innerHTML = SVGIcons.getEyeIcon(isPassword);
      }
    });
    
    updateForm?.addEventListener('submit', (e) => this.handleInfoUpdate(e));

    // Back button
    const backButton = document.getElementById('backButton');
    backButton?.addEventListener('click', () => {
      console.log('previous', window.history.back);
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/profile'; // Fallback if no history
      }
    });
  }
}