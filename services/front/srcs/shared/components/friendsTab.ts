import { Friend } from '../types/friend';
import { FriendService } from '../services/friendService';
import { i18n } from '../i18n';
import { SVGIcons } from '../../shared/components/svg';

export class FriendsTab {
  private isOpen = false;
  private friends: Friend[] = [];
  private container: HTMLDivElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'friends-tab-container';
    document.body.appendChild(this.container);
    this.loadFriends();

    // receive info if friendList changed
    window.addEventListener('friendListChanged', () => this.loadFriends())
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
      <div class="fixed bottom-4 right-4 flex flex-col items-end z-40">
        <button
          id="friends-tab-button"
          class="
            flex items-center justify-center
            bg-light-3 dark:bg-dark-1
            transition-colors text-light-0 dark:text-dark-3 cursor-pointer
            hover:bg-light-4 dark:hover:bg-dark-0
            ${this.isOpen
              ? 'w-40 h-10 rounded-t-md'
              : 'w-10 h-10 rounded-full'}
          "
          aria-expanded="${this.isOpen}"
          aria-controls="friends-panel"
        >
          ${SVGIcons.getFriendIcon()}
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
          class="w-40 bg-light-0 dark:bg-dark-4 shadow-lg ${this.isOpen ? '' : 'hidden'}"
          role="region"
          aria-labelledby="friends-tab-button"
        >
          ${
            onlineFriends.length > 0 && offlineFriends.length > 0
            ? `
              <!-- Online Friends -->
              <div class="p-4 border-b border-gray-200 dark:text-dark-4">
                <h3 class="text-sm font-medium text-light-4 dark:text-dark-0 mb-3">
                  ${i18n.t('onlineFriends')} (${onlineFriends.length})
                </h3>
                <div class="space-y-2">
                  ${onlineFriends.map(friend => `
                      <div 
                        class="-mx-4 px-4 py-2 hover:bg-light-1 dark:hover:bg-dark-3 cursor-pointer group"
                        data-username="${friend.username2}"
                      >
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <img 
                              src="${friend.avatar}" 
                              alt="${friend.username2}"
                              class="w-8 h-8 rounded-full object-cover"
                            >
                            <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-on-btn-light-0 dark:bg-on-btn-dark-0"></span>
                          </div>

                          <div class="text-left flex-1 min-w-0">
                            <span class="text-light-4 dark:text-dark-0 truncate block">
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
                <h3 class="text-sm font-medium text-light-4 dark:text-dark-0 mb-3">
                  ${i18n.t('offlineFriends')} (${offlineFriends.length})
                </h3>
                <div class="space-y-2">
                  ${offlineFriends.map(friend => `
                      <div 
                        class="-mx-4 px-4 py-2 hover:bg-light-1 dark:hover:bg-dark-3 cursor-pointer group"
                        data-username="${friend.username2}"
                      >
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <img 
                              src="${friend.avatar}" 
                              alt="${friend.username2}"
                              class="w-8 h-8 rounded-full object-cover"
                            >
                            <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-off-btn-light-0 dark:bg-off-btn-dark-0"></span>
                          </div>

                          <div class="text-left flex-1 min-w-0">
                            <span class="text-light-4 dark:text-dark-0 truncate block">
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
                        class="-mx-4 px-4 py-2 hover:bg-light-1 dark:hover:bg-dark-3 cursor-pointer group"
                        data-username="${friend.username2}"
                      >
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <img 
                              src="${friend.avatar}" 
                              alt="${friend.username2}"
                              class="w-8 h-8 rounded-full object-cover"
                            >
                            <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-on-btn-light-0 dark:bg-on-btn-dark-0"></span>
                          </div>

                          <div class="text-left flex-1 min-w-0">
                            <span class="text-light-4 dark:text-dark-0 truncate block">
                              ${friend.username2}
                            </span>
                          </div>
                        </div>
                      </div>
                    `).join('') : '')
                    ||
                    (offlineFriends.length > 0 ? offlineFriends.map(friend => `
                      <div 
                        class="-mx-4 px-4 py-2 hover:bg-light-1 dark:hover:bg-dark-3 cursor-pointer group"
                        data-username="${friend.username2}"
                      >
                        <div class="flex items-center space-x-3">
                          <div class="relative">
                            <img 
                              src="${friend.avatar}" 
                              alt="${friend.username2}"
                              class="w-8 h-8 rounded-full object-cover"
                            >
                            <span class="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-off-btn-light-0 dark:bg-off-btn-dark-0"></span>
                          </div>

                          <div class="text-left flex-1 min-w-0">
                            <span class="text-light-4 dark:text-dark-0 truncate block">
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