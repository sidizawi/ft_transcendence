import { User } from '../../shared/types/user';
import { i18n } from '../../shared/i18n';
import { TwoFactorAuth } from '../../shared/utils/twoFactorAuth';

export class Profile {
  constructor(private user: User, private onLogout: () => void) {}

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

      const response = await fetch('http://localhost:3000/upload/avatar', {
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
      this.user.avatar = data.avatarUrl;
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert('Failed to upload avatar');
    }
  }

  private async handle2FAToggle() {
    try {
      const result = await (this.user.twoFactorEnabled 
        ? TwoFactorAuth.disable(this.user.id)
        : TwoFactorAuth.enable(this.user.id));

      if (result.success) {
        this.user.twoFactorEnabled = !this.user.twoFactorEnabled;
        
        const response = await fetch('http://localhost:3000/auth/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
        }

        document.querySelector('main')!.innerHTML = this.render();
        this.setupEventListeners();
      }
    } catch (error) {
      console.error('2FA error:', error);
    }
  }

  private renderStats(wins: number, losses: number, totalGames: number): string {
    return `
      <div class="grid grid-cols-3 gap-4 mt-6">
        <div class="bg-green-100 dark:bg-green-800/30 p-4 rounded-lg text-center">
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">${wins}</p>
          <p class="text-sm text-green-800 dark:text-green-200">${i18n.t('stats.wins')}</p>
        </div>
        <div class="bg-red-100 dark:bg-red-800/30 p-4 rounded-lg text-center">
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">${losses}</p>
          <p class="text-sm text-red-800 dark:text-red-200">${i18n.t('stats.losses')}</p>
        </div>
        <div class="bg-blue-100 dark:bg-blue-800/30 p-4 rounded-lg text-center">
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${totalGames}</p>
          <p class="text-sm text-blue-800 dark:text-blue-200">${i18n.t('stats.totalGames')}</p>
        </div>
      </div>
    `;
  }

  render(): string {
    if (!this.user) {
      console.error('No user data available');
      return '<div class="text-center text-red-600">Error: No user data available</div>';
    }

    return `
      <div class="max-w-4xl mx-auto">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <!-- Profile Header -->
          <div class="relative">
            <div class="flex items-center px-8 pt-6">
              <div class="relative">
                <img 
                  src="${this.user.avatar}" 
                  alt="${i18n.t('profile')}" 
                  class="w-32 h-32 rounded-full object-cover"
                >
                <label 
                  for="avatar-upload" 
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
                  id="avatar-upload" 
                  accept="image/*"
                  class="hidden"
                >
              </div>
              <div class="ml-6">
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${this.user.username}</h1>
                <p class="text-gray-600 dark:text-gray-400">${this.user.email}</p>
              </div>
              <div class="ml-auto">
                <button 
                  id="toggle2FA"
                  class="${this.user.twoFactorEnabled 
                    ? 'bg-red-500 dark:bg-red-600/80 hover:bg-red-600 dark:hover:bg-red-600' 
                    : 'bg-green-500 dark:bg-green-600/80 hover:bg-green-600 dark:hover:bg-green-600'} text-white dark:text-white/90 px-4 py-2 rounded-lg transition-colors"
                >
                  ${this.user.twoFactorEnabled ? i18n.t('disable2FA') : i18n.t('enable2FA')}
                </button>
              </div>
            </div>
          </div>

          <!-- Profile Info -->
          <div class="px-8 pb-8 mt-12">
            <!-- Stats Tabs -->
            <div class="mt-4">
              <div class="relative">
                <div class="flex -mb-px space-x-8">
                  <button 
                    class="tab-button relative flex items-center justify-center h-12 px-4 text-lg font-medium transition-colors"
                    data-tab="pong"
                  >
                    <span class="flex items-center space-x-2">
                      <span>${i18n.t('pong')}</span>
                    </span>
                    <span class="tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-orange dark:bg-nature transform scale-x-0 transition-transform"></span>
                  </button>
                  <button 
                    class="tab-button relative flex items-center justify-center h-12 px-4 text-lg font-medium transition-colors"
                    data-tab="connect4"
                  >
                    <span class="flex items-center space-x-2">
                      <span>${i18n.t('connect4')}</span>
                    </span>
                    <span class="tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-orange dark:bg-nature transform scale-x-0 transition-transform"></span>
                  </button>
                </div>
                <div class="absolute bottom-0 left-0 w-full h-px bg-gray-300 dark:bg-gray-600"></div>
              </div>

              <!-- Pong Stats -->
              <div class="tab-content active" data-tab="pong">
                <h3 class="text-3xl font-semibold text-gray-900 dark:text-white text-center mt-6 mb-8">Pong Dashboard</h3>
                ${this.renderStats(this.user.stats.wins, this.user.stats.losses, this.user.stats.totalGames)}

                <!-- Tournament Button - Only in Pong tab -->
                <div class="mt-8">
                  <button class="w-full bg-orange-light dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature/90 shadow-md transition-colors">
                    ${i18n.t('joinTournament')}
                  </button>
                </div>
              </div>

              <!-- Connect4 Stats -->
              <div class="tab-content hidden" data-tab="connect4">
                <h3 class="text-3xl font-semibold text-gray-900 dark:text-white text-center mt-6 mb-8">Connect4 Dashboard</h3>
                ${this.renderStats(15, 8, 23)}
              </div>
            </div>

            <!-- Logout -->
            <div class="mt-8 pt-8 border-t border-gray-300 dark:border-gray-600 flex justify-center">
              <button 
                id="logoutBtn"
                class="px-8 bg-red-500 dark:bg-red-600/80 hover:bg-red-600 dark:hover:bg-red-600 text-white dark:text-white/90 py-3 rounded-lg transition-colors"
              >
                ${i18n.t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const toggle2FABtn = document.getElementById('toggle2FA');
    const logoutBtn = document.getElementById('logoutBtn');
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const avatarUpload = document.getElementById('avatar-upload') as HTMLInputElement;

    // Avatar upload
    avatarUpload?.addEventListener('change', (e) => this.handleAvatarChange(e));

    // 2FA toggle
    toggle2FABtn?.addEventListener('click', () => this.handle2FAToggle());

    // Logout
    logoutBtn?.addEventListener('click', this.onLogout);

    // Tab switching
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab');
        
        // Update button styles
        tabButtons.forEach(btn => {
          btn.classList.remove('text-orange', 'dark:text-nature');
          btn.classList.add('text-gray-600', 'dark:text-gray-400');
          btn.querySelector('.tab-indicator')?.classList.remove('scale-x-100');
          btn.querySelector('.tab-indicator')?.classList.add('scale-x-0');
        });

        // Set active tab style
        button.classList.remove('text-gray-600', 'dark:text-gray-400');
        button.classList.add('text-orange', 'dark:text-nature');
        button.querySelector('.tab-indicator')?.classList.remove('scale-x-0');
        button.querySelector('.tab-indicator')?.classList.add('scale-x-100');

        // Show corresponding content
        tabContents.forEach(content => {
          if (content.getAttribute('data-tab') === tab) {
            content.classList.remove('hidden');
          } else {
            content.classList.add('hidden');
          }
        });
      });
    });

    // Set initial active tab
    const initialTab = tabButtons[0];
    if (initialTab) {
      initialTab.classList.remove('text-gray-600', 'dark:text-gray-400');
      initialTab.classList.add('text-orange', 'dark:text-nature');
      initialTab.querySelector('.tab-indicator')?.classList.remove('scale-x-0');
      initialTab.querySelector('.tab-indicator')?.classList.add('scale-x-100');
    }
  }
}