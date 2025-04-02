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
  private isAddingFriend = false;
  private container: HTMLDivElement;
  private searchQuery: string = '';

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'friends-list-container';
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
      requestAnimationFrame(() => {
        this.setupEventListeners();
      });
    }
  }

  private getFilteredFriends() {
    return this.friends.filter(friend =>
      friend.username2.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  private renderFriendsList(): string {
    const filteredFriends = this.getFilteredFriends();
    const receivingRequests = filteredFriends.filter(f => f.status === 'receiving');
    const acceptedFriends = filteredFriends.filter(f => f.status === 'accepted');

    return `
      <div class="fixed bottom-4 right-4 flex flex-col items-end z-50">
        <!-- Friends Tab -->
        <div 
          id="friends-tab" 
          class="w-40 h-10 bg-orange-light dark:bg-nature text-white dark:text-nature-lightest rounded-t-md cursor-pointer flex items-center justify-center hover:bg-orange-light/90 dark:hover:bg-nature/90 transition-colors"
        >
          <span>${i18n.t('friends')} (${acceptedFriends.length})</span>
        </div>

        <!-- Friends Panel -->
        <div 
          id="friends-panel" 
          class="w-80 bg-orange-lightest dark:bg-forest-darker rounded-md shadow-lg p-4 ${this.isOpen ? '' : 'hidden'}"
        >
          <!-- Search -->
          <input
            type="text"
            id="friends-search"
            placeholder="${i18n.t('searchFriends')}"
            value="${this.searchQuery}"
            class="w-full p-2 mb-3 rounded bg-orange-lighter dark:bg-forest text-orange-darker dark:text-nature-lightest placeholder-orange-light/70 dark:placeholder-nature/50 focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-nature"
          />

          ${receivingRequests.length > 0 ? `
            <!-- Requests -->
            <div class="mb-4">
              <h3 class="text-sm text-orange-darker/70 dark:text-nature/70 mb-1">— ${i18n.t('requests')} —</h3>
              ${receivingRequests.map(friend => `
                <div class="flex items-center justify-between mb-2">
                  <span class="text-orange-darker dark:text-nature-lightest">${friend.username2}</span>
                  <div class="space-x-2">
                    <button 
                      class="bg-orange dark:bg-nature hover:bg-orange-darker dark:hover:bg-nature/90 px-2 py-1 rounded text-sm text-white dark:text-nature-lightest transition-colors"
                      data-action="accept"
                      data-username="${friend.username2}"
                    >
                      ${i18n.t('accept')}
                    </button>
                    <button 
                      class="bg-red-500 dark:bg-red-600/80 hover:bg-red-600 dark:hover:bg-red-600 px-2 py-1 rounded text-sm text-white transition-colors"
                      data-action="reject"
                      data-username="${friend.username2}"
                    >
                      ${i18n.t('reject')}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Friends List -->
          <div class="mb-4">
            <h3 class="text-sm text-orange-darker/70 dark:text-nature/70 mb-1">— ${i18n.t('friendsList')} —</h3>
            ${acceptedFriends.map(friend => `
              <div class="flex items-center justify-between mb-2 group">
                <span class="text-orange-darker dark:text-nature-lightest">${friend.username2}</span>
                <div class="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    class="text-orange dark:text-nature hover:text-orange-darker dark:hover:text-nature/90 transition-colors"
                    data-action="chat"
                    data-username="${friend.username2}"
                    data-userid="${friend.userid2}"
                    title="${i18n.t('chat')}"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <button 
                    class="text-red-500 hover:text-red-600 transition-colors"
                    data-action="block"
                    data-username="${friend.username2}"
                    title="${i18n.t('block')}"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Add Friend Button -->
          <div class="text-center">
            <button 
              id="add-friend-button"
              class="text-orange dark:text-nature hover:text-orange-darker dark:hover:text-nature/90 transition-colors"
            >
              [+] ${i18n.t('addFriend')}
            </button>
          </div>
        </div>
      </div>

      ${this.renderAddFriendModal()}
      ${this.renderChatWindow()}
    `;
  }

  private renderAddFriendModal(): string {
    if (!this.addFriendOpen) return '';

    return `
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">
            ${i18n.t('addFriend')}
          </h3>
          <form id="add-friend-form" class="space-y-4">
            <div>
              <label for="friend-username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ${i18n.t('enterUsername')}
              </label>
              <input 
                type="text" 
                id="friend-username"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange dark:focus:ring-nature focus:border-transparent"
                placeholder="${i18n.t('enterUsername')}"
                required
                ${this.isAddingFriend ? 'disabled' : ''}
              >
            </div>
            <div id="add-friend-error" class="text-red-500 dark:text-red-400 text-sm hidden"></div>
            <div class="flex justify-end space-x-3">
              <button 
                type="button"
                id="cancel-add-friend"
                class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                ${this.isAddingFriend ? 'disabled' : ''}
              >
                ${i18n.t('cancel')}
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-orange dark:bg-nature text-white dark:text-nature-lightest rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 relative"
                ${this.isAddingFriend ? 'disabled' : ''}
              >
                <span class="add-friend-text ${this.isAddingFriend ? 'invisible' : ''}">${i18n.t('add')}</span>
                ${this.isAddingFriend ? `
                  <span class="absolute inset-0 flex items-center justify-center">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                ` : ''}
              </button>
            </div>
          </form>
        </div>
      </div>
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

  private showAddFriendError(message: string) {
    const errorDiv = document.getElementById('add-friend-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
    }
  }

  private hideAddFriendError() {
    const errorDiv = document.getElementById('add-friend-error');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  private async handleAddFriend(username: string) {
    this.isAddingFriend = true;
    this.updateView();

    try {
      await FriendService.addFriend(username);
      this.addFriendOpen = false;
      await this.loadFriends();
    } catch (error) {
      console.error('Error adding friend:', error);
      this.showAddFriendError(error instanceof Error ? error.message : 'Failed to add friend');
    } finally {
      this.isAddingFriend = false;
      this.updateView();
    }
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
            this.updateView();
            
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

  setupEventListeners() {
    const friendsTab = document.getElementById('friends-tab');
    const addFriendButton = document.getElementById('add-friend-button');
    const searchInput = document.getElementById('friends-search') as HTMLInputElement;

    friendsTab?.addEventListener('click', () => {
      this.isOpen = !this.isOpen;
      this.updateView();
    });

    addFriendButton?.addEventListener('click', () => {
      this.addFriendOpen = true;
      this.updateView();
    });

    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.updateView();
    });

    // Add friend form handling
    const addFriendForm = document.getElementById('add-friend-form') as HTMLFormElement;
    const usernameInput = document.getElementById('friend-username') as HTMLInputElement;

    addFriendForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = usernameInput?.value.trim();

      if (username) {
        this.hideAddFriendError();
        await this.handleAddFriend(username);
      }
    });

    usernameInput?.addEventListener('input', () => {
      this.hideAddFriendError();
    });

    const cancelAddFriend = document.getElementById('cancel-add-friend');
    cancelAddFriend?.addEventListener('click', () => {
      this.addFriendOpen = false;
      this.updateView();
    });

    // Action buttons
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        const username = button.getAttribute('data-username');
        const userId = button.getAttribute('data-userid');
        if (action && username) {
          await this.handleFriendAction(action, username, userId || undefined);
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
        this.updateView();
      });
    });
  }
}
