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

  private openChatInNewTab(username: string) {
    const chatUrl = `/chat/${username}`;
    const chatWindow = window.open(chatUrl, `chat-${username}`, 'width=800,height=600');
    if (chatWindow) {
      chatWindow.focus();
    }
  }

  render(): string {
    const acceptedFriends = this.friends.filter(f => f.status === 'accepted');

    return `
      <div class="fixed bottom-4 right-4 flex flex-col items-end z-50">
        <!-- Friends Tab Button -->
        <button 
          id="friends-tab-button" 
          class="w-40 h-10 bg-orange dark:bg-nature rounded-t-md cursor-pointer flex items-center justify-center hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors text-white"
          aria-expanded="${this.isOpen ? 'true' : 'false'}"
          aria-controls="friends-panel"
        >
          <span class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>${i18n.t('friends')}</span>
          </span>
        </button>

        <!-- Friends Panel -->
        <div 
          id="friends-panel" 
          class="w-64 bg-orange-lighter dark:bg-forest rounded-t-lg shadow-lg ${this.isOpen ? '' : 'hidden'}"
          role="region"
          aria-labelledby="friends-tab-button"
        >
          <div class="p-4">
            <h3 class="text-sm font-medium text-orange-darker dark:text-nature-light mb-3">
              ${i18n.t('onlineFriends')}
            </h3>
            
            ${acceptedFriends.length > 0 ? `
              <div class="space-y-2">
                ${acceptedFriends.map(friend => `
                  <div 
                    class="flex items-center justify-between p-2 hover:bg-orange-lightest dark:hover:bg-forest-darker/50 rounded-lg cursor-pointer group"
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
                      <span class="text-orange-darker dark:text-nature-lightest text-sm">
                        ${friend.username2}
                      </span>
                    </div>
                    <button 
                      class="text-orange-darker dark:text-nature opacity-0 group-hover:opacity-100 transition-opacity"
                      data-action="chat"
                      data-username="${friend.username2}"
                      title="${i18n.t('chat')}"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </button>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-orange-darker/70 dark:text-nature/70 text-sm text-center py-2">
                ${i18n.t('noFriendsOnline')}
              </p>
            `}
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const tabButton = document.getElementById('friends-tab-button');
    const panel = document.getElementById('friends-panel');

    // Toggle panel
    tabButton?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.updateView();
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (this.isOpen && 
          panel && 
          !panel.contains(target) && 
          !tabButton?.contains(target)) {
        this.isOpen = false;
        this.updateView();
      }
    });

    // Handle friend interactions
    panel?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const chatButton = target.closest('button[data-action="chat"]');
      const friendItem = target.closest('div[data-username]');

      if (chatButton) {
        e.stopPropagation();
        const username = chatButton.getAttribute('data-username');
        if (username) {
          this.openChatInNewTab(username);
        }
      } else if (friendItem) {
        const username = friendItem.getAttribute('data-username');
        if (username) {
          window.location.href = `/users/${username}`;
        }
      }
    });
  }
}