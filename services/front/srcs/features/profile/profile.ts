import { User } from '../../shared/types/user';
import { GameStats } from '../../shared/types/game';
import { i18n } from '../../shared/i18n';
import { TwoFactorAuth } from '../../shared/utils/twoFactorAuth';
import { AvatarService } from '../../shared/services/avatarService';
import { StatsService } from '../../shared/services/statsService';

export class Profile {
  private pongStats: GameStats | null = null;
  private connect4Stats: GameStats | null = null;

  constructor(private user: User, private onLogout: () => void) {
    this.loadGameStats();
  }

  private async loadGameStats() {
    try {
      const [pongStats, connect4Stats] = await Promise.all([
        StatsService.getGameStats('pong'),
        StatsService.getGameStats('p4')
      ]);

      this.pongStats = pongStats;
      this.connect4Stats = connect4Stats;
      this.updateView();
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  }

  private updateView() {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = this.render();
      this.setupEventListeners();
    }
  }

  private async handleAvatarChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    try {
      const { avatarPath } = await AvatarService.uploadAvatar(file);
      // Update the user's avatar in memory and localStorage
      this.user.avatar = avatarPath;
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        userData.avatar = avatarPath;
        localStorage.setItem('user', JSON.stringify(userData));
      }
      this.updateView();
    } catch (error) {
      console.error('Avatar upload error:', error);
      alert(error instanceof Error ? error.message : i18n.t('updateError'));
    }
  }

  private async handle2FAToggle() {
    try {
      const result = await (this.user.twoFactorEnabled 
        ? TwoFactorAuth.disable()
        : TwoFactorAuth.enable());

      if (result.success) {
        // Update 2FA status in memory and localStorage
        this.user.twoFactorEnabled = !this.user.twoFactorEnabled;
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.twoFactorEnabled = this.user.twoFactorEnabled;
          localStorage.setItem('user', JSON.stringify(userData));
        }
        this.updateView();
      }
    } catch (error) {
      console.error('2FA error:', error);
    }
  }

  private get2FAButtonClasses(): string {
    return this.user.twoFactorEnabled
      ? 'bg-red-500 hover:bg-red-600 dark:bg-red-600/80 dark:hover:bg-red-600'
      : 'bg-green-500 hover:bg-green-600 dark:bg-green-600/80 dark:hover:bg-green-600';
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
                  lazy
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
              <div class="ml-auto flex items-center space-x-2">
                <a 
                  href="/profile/settings"
                  class="text-gray-600 dark:text-gray-400"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </a>
                ${!this.user.google ? `
                  <button 
                    id="toggle2FA"
                    class="${this.get2FAButtonClasses()} text-white dark:text-white/90 px-4 py-2 rounded-lg transition-colors"
                  >
                    ${this.user.twoFactorEnabled ? i18n.t('disable2FA') : i18n.t('enable2FA')}
                  </button>
                ` : ''}
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
                ${this.renderGameStats(this.pongStats)}

                <!-- Tournament Button - Only in Pong tab -->
                <div class="mt-8">
                  <button class="w-full bg-orange-light dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature/90 shadow-md transition-colors">
                    ${i18n.t('joinTournament')}
                  </button>
                </div>
              </div>

              <!-- Connect4 Stats -->
              <div class="tab-content hidden" data-tab="connect4">
                <h3 class="text-3xl font-semibold text-gray-900 dark:text-white text-center mt-6 mb-8">Connect 4 Dashboard</h3>
                ${this.renderGameStats(this.connect4Stats)}
              </div>
            </div>

            <!-- Friends and Logout -->
            <div class="mt-8 pt-8 border-t border-gray-300 dark:border-gray-600 flex justify-center space-x-4">
              <a 
                href="/friends"
                class="px-8 bg-orange-light dark:bg-nature text-white dark:text-nature-lightest py-3 rounded-lg hover:bg-orange-light/90 dark:hover:bg-nature/90 shadow-md transition-colors"
              >
                ${i18n.t('friends')}
              </a>
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

  private renderGameStats(stats: GameStats | null): string {
    if (!stats) {
      return `
        <div class="text-center text-gray-600 dark:text-gray-400 py-8">
          ${i18n.t('noGamesPlayed')}
        </div>
      `;
    }

    return `
      <div class="space-y-6">
        <!-- Main Stats -->
        <div class="grid grid-cols-4 gap-4">
          <div class="bg-green-100 dark:bg-green-800/30 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold text-green-600 dark:text-green-400">${stats.wins}</p>
            <p class="text-sm text-green-800 dark:text-green-200">${i18n.t('stats.wins')}</p>
          </div>
          <div class="bg-red-100 dark:bg-red-800/30 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold text-red-600 dark:text-red-400">${stats.losses}</p>
            <p class="text-sm text-red-800 dark:text-red-200">${i18n.t('stats.losses')}</p>
          </div>
          <div class="bg-blue-100 dark:bg-blue-800/30 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${stats.totalGames}</p>
            <p class="text-sm text-blue-800 dark:text-blue-200">${i18n.t('stats.totalGames')}</p>
          </div>
          <div class="bg-purple-100 dark:bg-purple-800/30 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${stats.winRate}%</p>
            <p class="text-sm text-purple-800 dark:text-purple-200">${i18n.t('stats.winRate')}</p>
          </div>
        </div>

        <!-- Additional Stats -->
        <div class="grid grid-cols-3 gap-4">
          <!-- Rank & ELO -->
          <div class="bg-gray-100 dark:bg-gray-800/30 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">${i18n.t('stats.rank')}</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">#${stats.rank || '-'}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600 dark:text-gray-400">${i18n.t('stats.elo')}</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">${stats.elo || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Tournaments -->
          <div class="bg-gray-100 dark:bg-gray-800/30 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">${i18n.t('stats.wonTournaments')}</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">${stats.tournaments?.won || '-'}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600 dark:text-gray-400">${i18n.t('stats.playedTournaments')}</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">${stats.tournaments?.total || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Streak -->
          <div class="bg-gray-100 dark:bg-gray-800/30 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">${i18n.t('stats.currentStreak')}</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalGames === 0 ? '-' : stats.streak?.current || '-'}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600 dark:text-gray-400">${i18n.t('stats.bestStreak')}</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalGames === 0 ? '-' : stats.streak?.best || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        ${stats.history && stats.history.length > 0 ? `
          <!-- Recent Games -->
          <div class="mt-6">
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">${i18n.t('stats.recentGames')}</h4>
            <div class="space-y-2">
              ${stats.history.map(game => `
                <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-800/30 p-3 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <span class="w-2 h-2 rounded-full ${game.result === 'win' ? 'bg-green-500' : 'bg-red-500'}"></span>
                    <div class="flex items-center space-x-2">
                      <img 
                        src="${game.avatar}" 
                        alt="${game.opponent}"
                        class="w-8 h-8 rounded-full object-cover"
                      >
                      <span class="text-gray-900 dark:text-white">${game.opponent}</span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-4">
                    ${game.score ? `<span class="text-gray-600 dark:text-gray-400">${game.score}</span>` : ''}
                    <span class="text-sm text-gray-500 dark:text-gray-400">${game.date}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
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