import { User } from '../types/user';
import { FriendConnection } from '../types/friend';
import { FriendService } from '../services/friendService';
import { Chat } from './chat';
import { i18n } from '../i18n';

export class FriendsList {
  private isOpen = false;
  private selectedFriend: string | null = null;
  private chatOpen = false;
  private friends: FriendConnection[] = [];
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
    return this.friends.filter(connection => 
      connection.friend.username.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  private openChatInNewTab(friendId: string, friendUsername: string) {
    const chatUrl = `/chat/${friendId}`;
    const chatWindow = window.open(chatUrl, `chat-${friendId}`, 'width=800,height=600');
    if (chatWindow) {
      chatWindow.focus();
    }
  }

  render(): string {
    const filteredFriends = this.getFilteredFriends();
    const incomingRequests = filteredFriends.filter(f => f.relationshipStatus === 'pending_incoming');
    const outgoingRequests = filteredFriends.filter(f => f.relationshipStatus === 'pending_outgoing');
    const acceptedFriends = filteredFriends.filter(f => f.relationshipStatus === 'accepted');

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
            ${incomingRequests.length > 0 ? `
              <span class="bg-red-600 px-2 py-0.5 rounded-full text-xs">
                ${incomingRequests.length}
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

          ${incomingRequests.length > 0 ? `
            <!-- Incoming Requests -->
            <div class="mb-4">
              <h3 class="text-sm text-gray-400 mb-1">— ${i18n.t('incomingRequests')} —</h3>
              ${incomingRequests.map(connection => `
                <div class="flex items-center justify-between mb-2 p-2 hover:bg-gray-700/50 rounded-lg">
                  <div class="flex items-center space-x-2">
                    <img 
                      src="${connection.friend.avatar}" 
                      alt="${connection.friend.username}"
                      class="w-8 h-8 rounded-full object-cover"
                    >
                    <span class="text-white">${connection.friend.username}</span>
                  </div>
                  <div class="space-x-2">
                    <button 
                      class="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm text-white transition-colors"
                      data-action="accept"
                      data-username="${connection.friend.username}"
                    >
                      ${i18n.t('accept')}
                    </button>
                    <button 
                      class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm text-white transition-colors"
                      data-action="reject"
                      data-username="${connection.friend.username}"
                    >
                      ${i18n.t('reject')}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${outgoingRequests.length > 0 ? `
            <!-- Outgoing Requests -->
            <div class="mb-4">
              <h3 class="text-sm text-gray-400 mb-1">— ${i18n.t('outgoingRequests')} —</h3>
              ${outgoingRequests.map(connection => `
                <div class="flex items-center justify-between mb-2 p-2 hover:bg-gray-700/50 rounded-lg">
                  <div class="flex items-center space-x-2">
                    <img 
                      src="${connection.friend.avatar}" 
                      alt="${connection.friend.username}"
                      class="w-8 h-8 rounded-full object-cover"
                    >
                    <span class="text-white">${connection.friend.username}</span>
                  </div>
                  <button 
                    class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm text-white transition-colors"
                    data-action="cancel"
                    data-username="${connection.friend.username}"
                  >
                    ${i18n.t('cancel')}
                  </button>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Friends List -->
          <div>
            <h3 class="text-sm text-gray-400 mb-1">— ${i18n.t('friendsList')} —</h3>
            ${acceptedFriends.length > 0 ? `
              <div class="space-y-2">
                ${acceptedFriends.map(connection => `
                  <div class="flex items-center justify-between p-2 hover:bg-gray-700/50 rounded-lg group cursor-pointer"
                       data-friend-id="${connection.friend.id}"
                       data-friend-username="${connection.friend.username}"
                       onclick="window.open('/chat/${connection.friend.id}', 'chat-${connection.friend.id}', 'width=800,height=600')">
                    <div class="flex items-center space-x-3">
                      <div class="relative">
                        <img 
                          src="${connection.friend.avatar}" 
                          alt="${connection.friend.username}"
                          class="w-8 h-8 rounded-full object-cover"
                        >
                        <span class="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${
                          connection.friend.status === 'online' ? 'bg-green-500' : 
                          connection.friend.status === 'away' ? 'bg-yellow-500' : 
                          'bg-gray-500'
                        }"></span>
                      </div>
                      <span class="text-white">${connection.friend.username}</span>
                    </div>
                    <div class="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        class="text-gray-400 hover:text-white transition-colors"
                        data-action="block"
                        data-username="${connection.friend.username}"
                        title="${i18n.t('block')}"
                        onclick="event.stopPropagation()"
                      >
                        <span class="text-xl">🚫</span>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <p class="text-gray-400 text-center py-4">
                ${i18n.t('noFriendsYet')}
              </p>
            `}
          </div>

          <!-- Add Friend Button -->
          <div class="text-center mt-4">
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

  private async handleFriendAction(action: string, username: string) {
    try {
      switch (action) {
        case 'accept':
          await FriendService.acceptFriend(username);
          break;
        case 'reject':
          await FriendService.rejectFriend(username);
          break;
        case 'cancel':
          await FriendService.cancelRequest(username);
          break;
        case 'block':
          await FriendService.blockFriend(username);
          break;
      }
      await this.loadFriends();
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

    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        const username = button.getAttribute('data-username');
        if (action && username) {
          await this.handleFriendAction(action, username);
        }
      });
    });
  }
}