import { User } from '../../shared/types/user';
import { GameStats } from '../../shared/types/game';
import { i18n } from '../../shared/i18n';
import { TwoFactorAuth } from '../../shared/utils/twoFactorAuth';
import { AvatarService } from '../../shared/services/avatarService';
import { StatsService } from '../../shared/services/statsService';
import { SVGIcons } from '../../shared/components/svg';

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
      ? 'bg-off-btn-light-0 hover:bg-off-btn-light-1 dark:bg-off-btn-dark-1 dark:hover:bg-off-btn-dark-0'
      : 'bg-on-btn-light-0 hover:bg-on-btn-light-1 dark:bg-on-btn-dark-1 dark:hover:bg-on-btn-dark-0';
  }

  render(): string {
    if (!this.user) {
      console.error('No user data available');
      return '<div class="text-center text-red-600">Error: No user data available</div>';
    }

    return `
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="max-w-4xl mx-auto">
          <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg overflow-hidden">

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
                    class="
                      absolute bottom-0 right-0 p-2 rounded-full shadow-lg
                      bg-light-1 dark:bg-dark-3
                      hover:bg-black hover:dark:bg-yellow
                      <!-- where is text changing colour -->
                      transition-colors cursor-pointer"
                    title="${i18n.t('changePhoto')}"
                  >
                    ${SVGIcons.getCameraIcon()}
                  </label>
                  <input 
                    type="file" id="avatar-upload" accept="image/*" class="hidden"
                  >
                </div>
                <div class="ml-6 max-w-[60%]">
                  <h1 class="text-2xl font-bold text-light-4 dark:text-dark-0 truncate overflow-hidden whitespace-nowrap">
                    ${this.user.username}
                  </h1>
                  <p class="text-light-4/80 dark:text-dark-0/80 truncate overflow-hidden whitespace-nowrap">
                    ${this.user.email}
                  </p>
                </div>
                <div class="ml-auto flex items-center space-x-2">
                  <a 
                    href="/profile/settings"
                    class="text-light-4/80 dark:text-dark-0/80 hover:text-light-4 hover:dark:text-dark-0"
                  >
                    ${SVGIcons.getGearIcon()}
                  </a>
                  ${!this.user.google ? `
                    <button 
                      id="toggle2FA"
                      class="${this.get2FAButtonClasses()} text-light-0 dark:text-dark-4 px-4 py-2 rounded-lg transition-colors"
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
                      class="tab-button relative flex items-center justify-center h-12 px-4 text-lg transition-colors text-light-4/80 dark:text-dark-0/80 font-medium"
                      data-tab="pong"
                      data-active="true"
                    >
                      <span class="flex items-center space-x-2">
                        <span>${i18n.t('pong')}</span>
                      </span>
                      <span class="tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-light-3 dark:bg-dark-1 transform scale-x-0 transition-transform"></span>
                    </button>
                    <button 
                      class="tab-button relative flex items-center justify-center h-12 px-4 text-lg transition-colors text-light-4/80 dark:text-dark-0/80 font-medium"
                      data-tab="connect4"
                      data-active="false"
                    >
                      <span class="flex items-center space-x-2">
                        <span>${i18n.t('connect4')}</span>
                      </span>
                      <span class="tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-light-3 dark:bg-dark-1 transform scale-x-0 transition-transform"></span>
                    </button>
                  </div>
                  <div class="absolute bottom-0 left-0 w-full h-px bg-light-2 dark:bg-dark-2"></div>
                </div>

                <!-- Pong Stats -->
                <div class="tab-content active" data-tab="pong">
                  <h3 class="text-3xl font-semibold text-light-4 dark:text-dark-0 text-center mt-6 mb-8">Pong Dashboard</h3>
                  ${this.renderGameStats(this.pongStats)}

                  <!-- Tournament Button - Only in Pong tab -->
                  <div class="mt-8">
                    <button class="w-full bg-light-2 dark:bg-dark-2 text-light-0 dark:text-dark-4 py-3 rounded-lg hover:bg-light-2/90 dark:hover:bg-dark-2/90 shadow-md transition-colors">
                      ${i18n.t('joinTournament')}
                    </button>
                  </div>
                </div>

                <!-- Connect4 Stats -->
                <div class="tab-content hidden" data-tab="connect4">
                  <h3 class="text-3xl font-semibold text-light-4 dark:text-dark-0 text-center mt-6 mb-8">Connect 4 Dashboard</h3>
                  ${this.renderGameStats(this.connect4Stats)}
                </div>
              </div>

              <!-- Friends and Logout -->
              <div class="mt-8 pt-8 border-t border-light-2 dark:border-dark-2 flex justify-center space-x-4">
                <a 
                  href="/friends"
                  class="px-8 bg-light-2 dark:bg-dark-2 text-light-0 dark:text-dark-4 py-3 rounded-lg hover:bg-light-2/90 dark:hover:bg-dark-2/90 shadow-md transition-colors"
                >
                  ${i18n.t('friends')}
                </a>
                <button 
                  id="logoutBtn"
                  class="
                    px-8 py-3 rounded-lg transition-colors
                    bg-off-btn-light-0 dark:bg-off-btn-dark-1
                    text-light-0 dark:text-dark-4
                    hover:bg-off-btn-light-1 dark:hover:bg-off-btn-dark-0
                  "
                >
                  ${i18n.t('logout')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private renderGameStats(stats: GameStats | null): string {
    if (!stats) {
      return `
        <div class="text-center text-light-4/80 dark:text-dark-2 py-8">
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
          <div class="bg-light-1 dark:bg-dark-3 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-light-4/80 dark:text-dark-0/80">${i18n.t('stats.rank')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">#${stats.rank || '-'}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-light-4/80 dark:text-dark-0/80">${i18n.t('stats.elo')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">${stats.elo || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Tournaments -->
          <div class="bg-light-1 dark:bg-dark-3 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-light-4/80 dark:text-dark-0/80">${i18n.t('stats.wonTournaments')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">${stats.tournaments?.won || '-'}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-light-4/80 dark:text-dark-0/80">${i18n.t('stats.playedTournaments')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">${stats.tournaments?.total || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Streak -->
          <div class="bg-light-1 dark:bg-dark-3 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-light-4/80 dark:text-dark-0/80">${i18n.t('stats.currentStreak')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">
                  ${stats.totalGames === 0 ? '-' : stats.streak?.current || '-'}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-light-4/80 dark:text-dark-0/80">${i18n.t('stats.bestStreak')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">
                  ${stats.totalGames === 0 ? '-' : stats.streak?.best || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        ${stats.history && stats.history.length > 0 ? `
          <!-- Recent Games -->
          <div class="mt-6">
            <h4 class="text-lg font-semibold text-light-4 dark:text-dark-0 mb-3">${i18n.t('stats.recentGames')}</h4>
            <div class="space-y-2">
              ${stats.history.map(game => `
                <div class="grid grid-cols-3 items-center bg-light-1 dark:bg-dark-3 p-3 rounded-lg">

                  <!-- Opponent (left) -->
                  <div class="flex items-center space-x-3">
                    <div class="relative">
                      <img 
                        src="${game.avatar}" 
                        alt="${game.opponent}"
                        class="w-8 h-8 rounded-full object-cover"
                      >
                      <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-on-btn-light-0 dark:bg-on-btn-dark-0"></span>
                      <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-off-btn-light-0 dark:bg-off-btn-dark-0"></span>
                    </div>
                    <a 
                      href="/users/${game.opponent}" 
                      class="text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0 transition-colors"
                    >
                      ${game.opponent}
                    </a>
                  </div>

                  <!-- Result / Score (centered) -->
                  <div class="flex justify-center items-center space-x-2 text-light-4 dark:text-dark-0">
                    <span>${game.result === 'win' ? i18n.t('victory') : i18n.t('defeat')}</span>
                    ${game.score ? `<span class="font-bold">${game.score}</span>` : ''}
                  </div>

                  <!-- Date (right) -->
                  <div class="flex items-center justify-end space-x-4">
                    <span class="text-sm text-light-4/80 dark:text-dark-0/80">${game.date}</span>
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
    const tabButtons = document.querySelectorAll('.tab-button') as NodeListOf<HTMLButtonElement>;
  const tabContents = document.querySelectorAll('.tab-content') as NodeListOf<HTMLElement>;
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
  
        // Reset all buttons
        tabButtons.forEach(btn => {
          btn.setAttribute('data-active', 'false');
          btn.classList.remove('text-light-3-500', 'font-bold');
          btn.classList.add('text-light-3-500/50', 'font-medium'); // light-3 but lighter when inactive
  
          btn.querySelector('.tab-indicator')?.classList.remove('scale-x-100');
          btn.querySelector('.tab-indicator')?.classList.add('scale-x-0');
        });
  
        // Set clicked button as active
        button.setAttribute('data-active', 'true');
        button.classList.remove('text-light-3-500/50', 'font-medium');
        button.classList.add('text-light-3-500', 'font-bold');
  
        button.querySelector('.tab-indicator')?.classList.remove('scale-x-0');
        button.querySelector('.tab-indicator')?.classList.add('scale-x-100');
  
        // Show correct content
        tabContents.forEach(content => {
          content.classList.toggle('hidden', content.getAttribute('data-tab') !== tab);
        });
  
        // Update ?tab param
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab || 'pong');
        history.replaceState(null, '', url.toString());
      });
    });
  
    // On load: restore from ?tab or default
    const params = new URLSearchParams(window.location.search);
    const activeTab = params.get('tab') || 'pong';
    const initialTab = Array.from(tabButtons).find(
      btn => btn.getAttribute('data-tab') === activeTab
    );
  
    if (initialTab) {
      initialTab.setAttribute('data-active', 'true');
      initialTab.classList.remove('text-light-3-500/50', 'font-medium');
      initialTab.classList.add('text-light-3-500', 'font-bold');
  
      initialTab.querySelector('.tab-indicator')?.classList.remove('scale-x-0');
      initialTab.querySelector('.tab-indicator')?.classList.add('scale-x-100');
  
      tabContents.forEach(content => {
        content.classList.toggle('hidden', content.getAttribute('data-tab') !== activeTab);
      });
    }
  }
}