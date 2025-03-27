import { User } from '../types/user';
import { Friend, FriendStatus } from '../types/friend';
import { FriendService } from '../services/friendService';
import { Chat } from './chat';
import { i18n } from '../i18n';

export class FriendsList {
  private isOpen = false;
  private selectedFriend: string | null = null;
  private chatOpen = false;
  private friends: Friend[] = [];
  private addFriendOpen = false;
  private activeChat: Chat | null = null;

  constructor() {
    this.loadFriends();
  }

  private async loadFriends() {
    try {
      this.friends = await FriendService.getFriendsList();
      this.render();
      this.setupEventListeners();
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  }

  private getStatusDot(status: FriendStatus): string {
    const colors = {
      accepted: 'bg-green-500',
      sending: 'bg-yellow-500',
      receiving: 'bg-blue-500',
      blocked: 'bg-red-500'
    };

    return `
      <span 
        class="w-3 h-3 rounded-full ${colors[status]}"
        title="${i18n.t(`friendStatus.${status}`)}"
      ></span>
    `;
  }

  private renderAddFriendModal(): string {
    if (!this.addFriendOpen) return '';

    return `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96">
          <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            ${i18n.t('addFriend')}
          </h3>
          <form id="add-friend-form" class="space-y-4">
            <div>
              <input 
                type="text" 
                id="friend-username"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange dark:focus:ring-nature focus:border-transparent"
                placeholder="${i18n.t('enterUsername')}"
                required
              >
            </div>
            <div id="add-friend-error" class="text-red-500 dark:text-red-400 text-sm hidden"></div>
            <div class="flex justify-end space-x-3">
              <button 
                type="button"
                id="cancel-add-friend"
                class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ${i18n.t('cancel')}
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-orange dark:bg-nature text-white dark:text-nature-lightest rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90"
              >
                ${i18n.t('add')}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  private renderFriendsList(): string {
    return `
      <div 
        id="friends-list" 
        class="fixed bottom-4 right-4 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 transform ${
          this.isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-2.5rem)]'
        }"
      >
        <!-- Header -->
        <div 
          class="bg-orange dark:bg-nature p-2 cursor-pointer flex items-center justify-between"
          id="friends-header"
        >
          <span class="text-white font-semibold">${i18n.t('friends')} (${this.friends.length})</span>
          <div class="flex items-center space-x-2">
            <button 
              id="add-friend-button"
              class="text-white hover:text-gray-200"
              title="${i18n.t('addFriend')}"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <svg 
              class="w-5 h-5 text-white transform ${this.isOpen ? 'rotate-180' : ''}" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Friends List -->
        <div class="max-h-96 overflow-y-auto ${this.isOpen ? '' : 'hidden'}">
          ${this.friends.map(friend => `
            <div 
              class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3 friend-item relative group"
              data-friend-username="${friend.username2}"
            >
              <img 
                src="https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username2)}&background=random" 
                alt="${friend.username2}" 
                class="w-10 h-10 rounded-full object-cover"
              >
              <span class="flex-1 text-gray-800 dark:text-white">${friend.username2}</span>
              ${this.getStatusDot(friend.status)}
              
              <!-- Action buttons -->
              <div class="absolute right-2 hidden group-hover:flex items-center space-x-1">
                ${friend.status === 'receiving' ? `
                  <button 
                    class="text-green-500 hover:text-green-600 p-1"
                    data-action="accept"
                    data-username="${friend.username2}"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button 
                    class="text-red-500 hover:text-red-600 p-1"
                    data-action="reject"
                    data-username="${friend.username2}"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ` : ''}
                ${friend.status === 'accepted' ? `
                  <button 
                    class="text-gray-500 hover:text-gray-600 p-1"
                    data-action="chat"
                    data-username="${friend.username2}"
                    data-userid="${friend.userid2}"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <button 
                    class="text-red-500 hover:text-red-600 p-1"
                    data-action="block"
                    data-username="${friend.username2}"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                ` : ''}
                ${friend.status === 'blocked' ? `
                  <button 
                    class="text-green-500 hover:text-green-600 p-1"
                    data-action="unblock"
                    data-username="${friend.username2}"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                    </svg>
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      ${this.renderAddFriendModal()}
      ${this.renderChatWindow()}
    `;
  }

  private renderChatWindow(): string {
    if (!this.selectedFriend || !this.chatOpen) return '';

    const friend = this.friends.find(f => f.username2 === this.selectedFriend);
    if (!friend) return '';

    return `
      <div 
        id="chat-window" 
        class="fixed bottom-4 right-72 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      >
        <!-- Chat Header -->
        <div class="bg-orange dark:bg-nature p-3 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <img 
              src="https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username2)}&background=random" 
              alt="${friend.username2}" 
              class="w-8 h-8 rounded-full object-cover"
            >
            <span class="text-white font-semibold">${friend.username2}</span>
            ${this.getStatusDot(friend.status)}
          </div>
          <button 
            class="text-white hover:text-gray-200 close-chat"
            data-username="${friend.username2}"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Chat Content -->
        <div class="h-96" id="chat-content-${friend.userid2}"></div>
      </div>
    `;
  }

  render(): string {
    return this.renderFriendsList();
  }

  private async handleFriendAction(action: string, username: string, userId?: string) {
    try {
      switch (action) {
        case 'accept':
          await FriendService.acceptFriend(username);
          break;
        case 'reject':
          await FriendService.rejectFriend(username);
          break;
        case 'block':
          await FriendService.blockFriend(username);
          break;
        case 'unblock':
          await FriendService.unblockFriend(username);
          break;
        case 'chat':
          if (userId) {
            this.selectedFriend = username;
            this.chatOpen = true;
            this.render();
            this.setupEventListeners();
            
            // Initialize chat after rendering
            const chatContent = document.getElementById(`chat-content-${userId}`);
            if (chatContent) {
              if (this.activeChat) {
                this.activeChat.destroy();
              }
              this.activeChat = new Chat(userId, username);
              chatContent.innerHTML = this.activeChat.render();
              this.activeChat.setupEventListeners();
            }
          }
          break;
      }
      if (action !== 'chat') {
        await this.loadFriends();
      }
    } catch (error) {
      console.error(`Error handling friend action ${action}:`, error);
    }
  }

  private showAddFriendError(message: string) {
    const errorDiv = document.getElementById('add-friend-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  setupEventListeners() {
    const friendsList = document.getElementById('friends-list');
    const friendsHeader = document.getElementById('friends-header');
    const addFriendButton = document.getElementById('add-friend-button');

    friendsHeader?.addEventListener('click', (e) => {
      if (e.target !== addFriendButton) {
        this.isOpen = !this.isOpen;
        this.render();
        this.setupEventListeners();
      }
    });

    addFriendButton?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.addFriendOpen = true;
      this.render();
      this.setupEventListeners();
    });

    // Add friend form handling
    const addFriendForm = document.getElementById('add-friend-form') as HTMLFormElement;
    addFriendForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('friend-username') as HTMLInputElement;
      const username = usernameInput?.value.trim();

      if (username) {
        try {
          await FriendService.addFriend(username);
          this.addFriendOpen = false;
          await this.loadFriends();
        } catch (error) {
          console.error('Error adding friend:', error);
          this.showAddFriendError(error instanceof Error ? error.message : 'Failed to add friend');
        }
      }
    });

    const cancelAddFriend = document.getElementById('cancel-add-friend');
    cancelAddFriend?.addEventListener('click', () => {
      this.addFriendOpen = false;
      this.render();
      this.setupEventListeners();
    });

    // Action buttons
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        const username = button.getAttribute('data-username');
        const userId = button.getAttribute('data-userid');
        if (action && username) {
          await this.handleFriendAction(action, username, userId);
        }
      });
    });

    // Close chat button
    document.querySelectorAll('.close-chat').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.activeChat) {
          this.activeChat.destroy();
          this.activeChat = null;
        }
        this.chatOpen = false;
        this.selectedFriend = null;
        this.render();
        this.setupEventListeners();
      });
    });
  }
}