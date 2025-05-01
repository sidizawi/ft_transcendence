import { User } from '../../shared/types/user';
import { FriendGameStats } from '../../shared/types/game';
import { i18n } from '../../shared/i18n';
import { StatsService } from '../../shared/services/statsService';
import { FriendService } from '../../shared/services/friendService';

export class FriendProfile {
  private pongStats: FriendGameStats | null = null;
  private connect4Stats: FriendGameStats | null = null;
  private friendshipStatus: string | null = null;
  private userId: string | null = null;

  constructor(private username: string, private avatar: string) {
    this.loadGameStats();
    this.loadFriendshipStatus();
  }

  private async loadGameStats() {
    try {
      const [pongStats, connect4Stats] = await Promise.all([
        StatsService.getFriendGameStats('pong', this.username),
        StatsService.getFriendGameStats('p4', this.username)
      ]);

      this.pongStats = pongStats;
      this.connect4Stats = connect4Stats;
      this.updateView();
    } catch (error) {
      console.error('Error loading game stats:', error);
    }
  }

  private async loadFriendshipStatus() {
    try {
      const friends = await FriendService.getFriendsList();
      const friend = friends.find(f => f.username2 === this.username);
      if (friend) {
        this.friendshipStatus = friend.status;
        this.userId = friend.userid2;
      } else {
        this.friendshipStatus = 'none';
        this.userId = null;
      }
      this.updateView();
    } catch (error) {
      console.error('Error loading friendship status:', error);
    }
  }

  private updateView() {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = this.render();
      this.setupEventListeners();
    }
  }

  private async handleFriendAction(action: string) {
    try {
      switch (action) {
        case 'add':
          await FriendService.addFriend(this.username);
          this.friendshipStatus = 'sending';
          break;
        case 'block':
          await FriendService.blockFriend(this.username);
          this.friendshipStatus = 'blocked';
          break;
        case 'unblock':
          await FriendService.unblockFriend(this.username);
          this.friendshipStatus = 'none';
          break;
        case 'delete':
          await FriendService.deleteFriend(this.username);
          this.friendshipStatus = 'none';
          break;
        case 'cancel':
          await FriendService.cancelRequest(this.username);
          this.friendshipStatus = 'none';
          break;
      }
      this.updateView();

      // inform friendList changed
      window.dispatchEvent(new CustomEvent('friendListChanged', {
        detail: { username: this.username, newStatus: this.friendshipStatus }
      }));
    } catch (error) {
      console.error('Error handling friend action:', error);
    }
  }

  private openChat() {
    if (this.userId) {
      const chatUrl = `/chat/${this.username}`;
      const chatWindow = window.open(chatUrl, `chat-${this.username}`, 'width=800,height=600');
      if (chatWindow) {
        chatWindow.focus();
      }
    }
  }

  private renderActionButtons(): string {
    const buttons = [];

    if (this.friendshipStatus === 'accepted') {
      buttons.push(`
        <button 
          id="messageBtn"
          class="bg-light-3 dark:bg-dark-2 text-dark-0 dark:text-dark-0 px-4 py-2 rounded-lg hover:bg-light-4 dark:hover:bg-dark-2/90 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          ${i18n.t('message')}
        </button>
        <button 
          id="deleteFriendBtn"
          class="bg-red-500 text-dark-0 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          ${i18n.t('delete')}
        </button>
        <button 
          id="blockUserBtn"
          class="bg-red-500 text-dark-0 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          ${i18n.t('block')}
        </button>
      `);
    } else if (this.friendshipStatus === 'blocked') {
      buttons.push(`
        <button 
          id="unblockBtn"
          class="bg-light-10 text-dark-0 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
          ${i18n.t('unblock')}
        </button>
      `);
    } else if (this.friendshipStatus === 'sending') {
      buttons.push(`
        <button 
          id="cancelRequestBtn"
          class="bg-light-10 text-dark-0 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          ${i18n.t('cancel')}
        </button>
      `);
    } else if (this.friendshipStatus === 'none') {
      buttons.push(`
        <button 
          id="addFriendBtn"
          class="bg-green-500 text-dark-0 px-4 py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          ${i18n.t('addFriend')}
        </button>
      `);
    }

    return buttons.length > 0 ? `
      <div class="absolute top-6 right-8 flex gap-2">
        ${buttons.join('')}
      </div>
    ` : '';
  }

  render(): string {
    return `
      <div class="max-w-4xl mx-auto">
        <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg overflow-hidden">

          <!-- Profile Header -->
          <div class="relative">
            <div class="flex items-center px-8 pt-6">
              <div class="relative shrink-0">
                <img 
                  src="/${this.avatar}" 
                  alt="${this.username}" 
                  class="w-32 h-32 rounded-full object-cover"
                >
              </div>
              <div class="ml-6 flex-1 min-w-0">
                <h1 class="text-2xl font-bold text-light-4 dark:text-dark-0 truncate overflow-hidden whitespace-nowrap">
                  ${this.username}
                </h1>
              </div>
              ${this.renderActionButtons()}
            </div>
          </div>

          <!-- Profile Info -->
          <div class="px-8 pb-8 mt-12">
            <!-- Stats Tabs -->
            <div class="mt-4">
              <div class="relative">
                <div class="flex -mb-px space-x-8">
                  <button 
                    class="tab-button relative flex items-center justify-center h-12 px-4 text-lg transition-colors text-light-4/80 dark:text-dark-2 font-medium"
                    data-tab="pong"
                    data-active="true"
                  >
                    <span class="flex items-center space-x-2">
                      <span>${i18n.t('pong')}</span>
                    </span>
                    <span class="tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-light-3 dark:bg-dark-2 transform scale-x-0 transition-transform"></span>
                  </button>
                  <button 
                    class="tab-button relative flex items-center justify-center h-12 px-4 text-lg transition-colors text-light-4/80 dark:text-dark-2 font-medium"
                    data-tab="connect4"
                    data-active="false"
                  >
                    <span class="flex items-center space-x-2">
                      <span>${i18n.t('connect4')}</span>
                    </span>
                    <span class="tab-indicator absolute bottom-0 left-0 w-full h-0.5 bg-light-3 dark:bg-dark-2 transform scale-x-0 transition-transform"></span>
                  </button>
                </div>
                <div class="absolute bottom-0 left-0 w-full h-px bg-light-2 dark:bg-dark-1"></div>
              </div>

              <!-- Pong Stats -->
              <div class="tab-content active" data-tab="pong">
                <h3 class="text-3xl font-semibold text-light-4 dark:text-dark-0 text-center mt-6 mb-8">Pong Dashboard</h3>
                ${this.renderGameStats(this.pongStats)}
              </div>

              <!-- Connect4 Stats -->
              <div class="tab-content hidden" data-tab="connect4">
                <h3 class="text-3xl font-semibold text-light-4 dark:text-dark-0 text-center mt-6 mb-8">Connect 4 Dashboard</h3>
                ${this.renderGameStats(this.connect4Stats)}
              </div>
            </div>
          </div>
        </div>
        <!-- Back Button -->
        <div class="mt-8 flex justify-center">
          <a 
            href="/friends"
            class="px-6 py-2 text-light-4 dark:text-dark-0 rounded-lg transition-colors"
          >
            ${i18n.t('back')}
          </a>
        </div>
      </div>
    `;
  }

  private renderGameStats(stats: FriendGameStats | null): string {
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
          <div class="bg-light-1 dark:bg-dark-4/30 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-light-4/80 dark:text-dark-2">${i18n.t('stats.rank')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">#${stats.rank || '-'}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-light-4/80 dark:text-dark-2">${i18n.t('stats.elo')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">${stats.elo || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Tournaments -->
          <div class="bg-light-1 dark:bg-dark-4/30 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-light-4/80 dark:text-dark-2">${i18n.t('stats.wonTournaments')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">${stats.tournaments?.won || '-'}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-light-4/80 dark:text-dark-2">${i18n.t('stats.playedTournaments')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">${stats.tournaments?.total || '-'}</p>
              </div>
            </div>
          </div>

          <!-- Streak -->
          <div class="bg-light-1 dark:bg-dark-4/30 p-4 rounded-lg">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-light-4/80 dark:text-dark-2">${i18n.t('stats.currentStreak')}</p>
                <p class="text-xl font-bold text-light-4 dark:text-dark-0">
                  ${stats.totalGames === 0 ? '-' : stats.streak?.current || '-'}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-light-4/80 dark:text-dark-2">${i18n.t('stats.bestStreak')}</p>
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
                <div class="flex items-center justify-between bg-light-1 dark:bg-dark-4/30 p-3 rounded-lg">
                  <div class="flex items-center space-x-3">
                    <span class="w-2 h-2 rounded-full ${game.playerWin === this.username ? 'bg-green-500' : 'bg-red-500'}"></span>
                    <div class="flex items-center space-x-2">
                      <img 
                        src="/${game.avatar}" 
                        alt="${game.opponent}"
                        class="w-8 h-8 rounded-full object-cover"
                      >
                      <span class="text-light-4 dark:text-dark-0">${game.opponent}</span>
                    </div>
                  </div>
                  <div class="flex items-center space-x-4">
                    ${game.score ? `<span class="text-light-4/80 dark:text-dark-2">${game.score}</span>` : ''}
                    <span class="text-sm text-gray-500 dark:text-dark-2">${game.date}</span>
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
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button') as NodeListOf<HTMLButtonElement>;
    const tabContents = document.querySelectorAll('.tab-content') as NodeListOf<HTMLElement>;

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


    // Action buttons
    const messageBtn = document.getElementById('messageBtn');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const blockUserBtn = document.getElementById('blockUserBtn');
    const unblockBtn = document.getElementById('unblockBtn');
    const deleteFriendBtn = document.getElementById('deleteFriendBtn');
    const cancelRequestBtn = document.getElementById('cancelRequestBtn');

    messageBtn?.addEventListener('click', () => this.openChat());
    addFriendBtn?.addEventListener('click', () => this.handleFriendAction('add'));
    blockUserBtn?.addEventListener('click', () => this.handleFriendAction('block'));
    unblockBtn?.addEventListener('click', () => this.handleFriendAction('unblock'));
    deleteFriendBtn?.addEventListener('click', () => this.handleFriendAction('delete'));
    cancelRequestBtn?.addEventListener('click', () => this.handleFriendAction('cancel'));
  }
}