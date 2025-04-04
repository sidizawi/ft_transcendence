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
      this.setupEventListeners();
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
        <button 
          id="friends-tab" 
          class="w-40 h-10 bg-gray-800 rounded-t-md cursor-pointer flex items-center justify-center hover:bg-gray-700 transition-colors text-white"
          aria-expanded="${this.isOpen ? 'true' : 'false'}"
          aria-controls="friends-panel"
        >
          <span class="flex items-center gap-2">
            <span>${i18n.t('friends')}</span>
            ${receivingRequests.length > 0 ? `
              <span class="bg-red-600 px-2 py-0.5 rounded-full text-xs">
                ${receivingRequests.length}
              </span>
            ` : ''}
          </span>
        </button>

        <!-- Friends Panel -->
        <div 
          id="friends-panel" 
          class="w-80 bg-gray-800 rounded-md shadow-lg p-4 ${this.isOpen ? '' : 'hidden'}"
          role="region"
          aria-labelledby="friends-tab"
        >
          <!-- Search -->
          <input
            type="text"
            id="friends-search"
            placeholder="${i18n.t('searchFriends')}"
            value="${this.searchQuery}"
            class="w-full p-2 mb-3 rounded bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          ${receivingRequests.length > 0 ? `
            <!-- Requests -->
            <div class="mb-4">
              <h3 class="text-sm text-gray-400 mb-1">— ${i18n.t('requests')} —</h3>
              ${receivingRequests.map(friend => `
                <div class="flex items-center justify-between mb-2">
                  <span class="text-white">${friend.username2}</span>
                  <div class="space-x-2">
                    <button 
                      class="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm text-white transition-colors"
                      data-action="accept"
                      data-username="${friend.username2}"
                    >
                      ${i18n.t('accept')}
                    </button>
                    <button 
                      class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm text-white transition-colors"
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
            <h3 class="text-sm text-gray-400 mb-1">— ${i18n.t('friendsList')} —</h3>
            ${acceptedFriends.map(friend => `
              <div class="flex items-center justify-between mb-2 group">
                <span class="text-white flex items-center">
                  <span class="mr-2">●</span> <!-- Online indicator -->
                  ${friend.username2}
                </span>
                <div class="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    class="text-gray-400 hover:text-white transition-colors"
                    data-action="chat"
                    data-username="${friend.username2}"
                    data-userid="${friend.userid2}"
                    title="${i18n.t('chat')}"
                  >
                    <span class="text-xl">💬</span>
                  </button>
                  <button 
                    class="text-gray-400 hover:text-white transition-colors"
                    data-action="block"
                    data-username="${friend.username2}"
                    title="${i18n.t('block')}"
                  >
                    <span class="text-xl">🚫</span>
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Add Friend Button -->
          <div class="text-center">
            <button 
              id="add-friend-button"
              class="text-blue-400 hover:underline transition-colors"
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
        <div class="bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 class="text-xl font-bold mb-4 text-white">
            ${i18n.t('addFriend')}
          </h3>
          <form id="add-friend-form" class="space-y-4">
            <div>
              <label for="friend-username" class="block text-sm font-medium text-gray-300 mb-1">
                ${i18n.t('enterUsername')}
              </label>
              <input 
                type="text" 
                id="friend-username"
                class="w-full px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="${i18n.t('enterUsername')}"
                required
                ${this.isAddingFriend ? 'disabled' : ''}
              >
            </div>
            <div id="add-friend-error" class="text-red-400 text-sm hidden"></div>
            <div class="flex justify-end space-x-3">
              <button 
                type="button"
                id="cancel-add-friend"
                class="px-4 py-2 text-gray-400 hover:text-white"
                ${this.isAddingFriend ? 'disabled' : ''}
              >
                ${i18n.t('cancel')}
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 relative"
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
        class="fixed bottom-4 right-72 w-80 bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      >
        <!-- Chat Header -->
        <div class="bg-gray-700 p-3 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <img 
              src="https://ui-avatars.com/api/?name=${encodeURIComponent(friend.username2)}&background=random" 
              alt="${friend.username2}" 
              class="w-8 h-8 rounded-full object-cover"
            >
            <span class="text-white font-semibold">${friend.username2}</span>
          </div>
          <button 
            class="text-gray-400 hover:text-white close-chat"
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

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const friendsPanel = document.getElementById('friends-panel');
      const friendsTabButton = document.getElementById('friends-tab');

      if (this.isOpen && 
          friendsPanel && 
          !friendsPanel.contains(target) && 
          !friendsTabButton?.contains(target)) {
        this.isOpen = false;
        this.updateView();
      }
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