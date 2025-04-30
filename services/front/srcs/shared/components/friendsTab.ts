import { Friend } from '../types/friend';
import { FriendService } from '../services/friendService';
import { i18n } from '../i18n';

export class FriendsTab {
  private isOpen = false;
  private friends: Friend[] = [];
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'friends-tab-container';
    document.body.appendChild(this.container);
    this.loadFriends();
  }

  private async loadFriends() {
    try {
      this.friends = await FriendService.getFriendsList();
      this.updateView();
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }

  private updateView() {
    if (this.container) {
      this.container.innerHTML = this.render();
      this.setupEventListeners();
    }
  }


  render(): string {
    const accepted   = this.friends.filter(f => f.status === 'accepted');
    const onlineFriends     = accepted.filter(f => f.status);
    const offlineFriends    = accepted.filter(f => !f.status);
  
    return `
      <div class="fixed bottom-4 right-4 flex flex-col items-end z-50">
        <button
          id="friends-tab-button"
          class="
            flex items-center justify-center
            bg-orange dark:bg-nature
            transition-colors text-white cursor-pointer
            hover:bg-orange-darker dark:hover:bg-nature/90
            ${this.isOpen
              ? 'w-40 h-10 rounded-t-md'
              : 'w-10 h-10 rounded-full'}
          "
          aria-expanded="${this.isOpen}"
          aria-controls="friends-panel"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span
            id="friends-tab-label"
            class="ml-2 ${this.isOpen ? '' : 'hidden'}"
          >
            ${i18n.t('friends')}
          </span>
        </button>
        <!-- Friends Panel -->
        <div 
          id="friends-panel" 
          class="w-40 bg-white dark:bg-forest shadow-lg ${this.isOpen ? '' : 'hidden'}"
          role="region"
          aria-labelledby="friends-tab-button"
        >
          ${
            onlineFriends.length > 0 && offlineFriends.length > 0
            ? `
              <!-- Online Friends -->
              <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-medium text-orange-darker dark:text-nature-light mb-3">
                  ${i18n.t('onlineFriends')} (${onlineFriends.length})
                </h3>
                <div class="space-y-2">
                  ${onlineFriends.map(friend => `
                      <div 
                        class="-mx-4 px-4 py-2 hover:bg-gray-50 dark:hover:bg-forest-darker/50 cursor-pointer group"
                        data-username="${friend.username2}"
                      >
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <img 
                              src="${friend.avatar}" 
                              alt="${friend.username2}"
                              class="w-8 h-8 rounded-full object-cover"
                            >
                            <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-orange-lighter dark:border-forest"></span>
                          </div>

                          <div class="text-left flex-1 min-w-0">
                            <span class="text-orange-darker dark:text-nature-lightest truncate block">
                              ${friend.username2}
                            </span>
                          </div>
                        </div>
                      </div>
                  `).join('')}
                </div>
              </div>

              <!-- Offline Friends -->
              <div class="p-4">
                <h3 class="text-sm font-medium text-orange-darker dark:text-nature-light mb-3">
                  ${i18n.t('offlineFriends')} (${offlineFriends.length})
                </h3>
                <div class="space-y-2">
                  ${offlineFriends.map(friend => `
                      <div 
                        class="-mx-4 px-4 py-2 hover:bg-gray-50 dark:hover:bg-forest-darker/50 cursor-pointer group"
                        data-username="${friend.username2}"
                      >
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <img 
                              src="${friend.avatar}" 
                              alt="${friend.username2}"
                              class="w-8 h-8 rounded-full object-cover"
                            >
                            <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-orange-lighter dark:border-forest"></span>
                          </div>

                          <div class="text-left flex-1 min-w-0">
                            <span class="text-orange-darker dark:text-nature-lightest truncate block">
                              ${friend.username2}
                            </span>
                          </div>
                        </div>
                      </div>
                  `).join('')}
                </div>
              </div>
            `
            : `
              <!-- Unified Friends List (either online or offline) -->
              <div class="p-4">
                <div class="space-y-2">
                  ${
                    (onlineFriends.length > 0 ? onlineFriends.map(friend => `
                      <div 
                        class="-mx-4 px-4 py-2 hover:bg-gray-50 dark:hover:bg-forest-darker/50 cursor-pointer group"
                        data-username="${friend.username2}"
                      >
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <img 
                              src="${friend.avatar}" 
                              alt="${friend.username2}"
                              class="w-8 h-8 rounded-full object-cover"
                            >
                            <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-orange-lighter dark:border-forest"></span>
                          </div>

                          <div class="text-left flex-1 min-w-0">
                            <span class="text-orange-darker dark:text-nature-lightest truncate block">
                              ${friend.username2}
                            </span>
                          </div>
                        </div>
                      </div>
                    `).join('') : '')
                    ||
                    (offlineFriends.length > 0 ? offlineFriends.map(friend => `
                      <div 
                        class="-mx-4 px-4 py-2 hover:bg-gray-50 dark:hover:bg-forest-darker/50 cursor-pointer group"
                        data-username="${friend.username2}"
                      >
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <img 
                              src="${friend.avatar}" 
                              alt="${friend.username2}"
                              class="w-8 h-8 rounded-full object-cover"
                            >
                            <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-orange-lighter dark:border-forest"></span>
                          </div>

                          <div class="text-left flex-1 min-w-0">
                            <span class="text-orange-darker dark:text-nature-lightest truncate block">
                              ${friend.username2}
                            </span>
                          </div>
                        </div>
                      </div>
                    `).join('') : '')
                  }
                </div>
              </div>
            `
          }
        </div>

      </div>
    `;
  }


  setupEventListeners() {

    const tabButton = document.getElementById('friends-tab-button')!;
    const panel     = document.getElementById('friends-panel')!;
    const label     = document.getElementById('friends-tab-label')!;
  
    tabButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isOpen = !this.isOpen;
  
      // panel open/close
      panel.classList.toggle('hidden');
  
      // aria
      tabButton.setAttribute('aria-expanded', String(this.isOpen));
  
      // swap width + border shape
      tabButton.classList.toggle('w-10');
      tabButton.classList.toggle('w-40');
      tabButton.classList.toggle('rounded-full');
      tabButton.classList.toggle('rounded-t-md');
  
      // show/hide text
      label.classList.toggle('hidden');
    });
  
    // click outside to close
    document.addEventListener('click', (e) => {
      if (!this.isOpen) return;
      const tgt = e.target as HTMLElement;
      if (!panel.contains(tgt) && !tabButton.contains(tgt)) {
        this.isOpen = false;
        panel.classList.add('hidden');
        tabButton.setAttribute('aria-expanded', 'false');
        tabButton.classList.replace('w-40', 'w-10');
        tabButton.classList.replace('rounded-t-md', 'rounded-full');
        label.classList.add('hidden');
      }
    });

    // Open chat
    panel?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const friendItem = target.closest('div[data-username]');

      if (friendItem) {
        const username = friendItem.getAttribute('data-username');
        if (username) {
          window.location.href = `/chat/${username}`;
        }
      }
    });

  }
}