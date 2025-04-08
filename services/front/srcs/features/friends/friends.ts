import { Friend } from '../../shared/types/friend';
import { FriendService } from '../../shared/services/friendService';
import { i18n } from '../../shared/i18n';

export class Friends {
  private friends: Friend[] = [];
  private addFriendOpen = false;
  private isAddingFriend = false;
  private searchQuery: string = '';
  private isLoading = true;

  constructor() {
    this.loadFriends();
  }

  private async loadFriends() {
    try {
      this.isLoading = true;
      this.updateView();
      this.friends = await FriendService.getFriendsList();
    } catch (error) {
      console.error('Error loading friends:', error);
      this.friends = [];
    } finally {
      this.isLoading = false;
      this.updateView();
    }
  }

  private updateView() {
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = this.render();
      this.setupEventListeners();
    }
  }

  private getFilteredFriends() {
    if (this.isLoading || !this.friends) return [];
    return this.friends.filter(friend => 
      friend.username2.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
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

  render(): string {
    if (this.isLoading) {
      return `
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex justify-center items-center h-64">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-orange dark:border-nature border-t-transparent"></div>
            </div>
          </div>
        </div>
      `;
    }

    const filteredFriends = this.getFilteredFriends();
    const receivingRequests = filteredFriends.filter(f => f.status === 'receiving');
    const acceptedFriends = filteredFriends.filter(f => f.status === 'accepted');

    return `
      <div class="max-w-4xl mx-auto px-4 py-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">${i18n.t('friends')}</h1>
            <button 
              id="add-friend-button"
              class="bg-orange dark:bg-nature text-white dark:text-nature-lightest px-4 py-2 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors"
            >
              ${i18n.t('addFriend')}
            </button>
          </div>

          <!-- Search -->
          <input
            type="text"
            id="friends-search"
            placeholder="${i18n.t('searchFriends')}"
            value="${this.searchQuery}"
            class="w-full p-3 mb-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-nature"
          />

          ${receivingRequests.length > 0 ? `
            <!-- Requests -->
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${i18n.t('requests')}</h3>
              <div class="space-y-3">
                ${receivingRequests.map(friend => `
                  <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-gray-900 dark:text-white">${friend.username2}</span>
                    <div class="space-x-2">
                      <button 
                        class="bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-white transition-colors"
                        data-action="accept"
                        data-username="${friend.username2}"
                      >
                        ${i18n.t('accept')}
                      </button>
                      <button 
                        class="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-white transition-colors"
                        data-action="reject"
                        data-username="${friend.username2}"
                      >
                        ${i18n.t('reject')}
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Friends List -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${i18n.t('friendsList')}</h3>
            ${acceptedFriends.length > 0 ? `
              <div class="space-y-3">
                ${acceptedFriends.map(friend => `
                  <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg group">
                    <div class="flex items-center space-x-3">
                      <span class="w-2 h-2 rounded-full bg-green-500"></span>
                      <span class="text-gray-900 dark:text-white">${friend.username2}</span>
                    </div>
                    <div class="space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
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
            ` : `
              <p class="text-gray-600 dark:text-gray-400 text-center py-8">
                ${i18n.t('noFriendsYet')}
              </p>
            `}
          </div>
        </div>

        <div class="mt-8 flex justify-center">
          <a 
            href="/profile"
            class="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            ${i18n.t('back')}
          </a>
        </div>
      </div>

      ${this.renderAddFriendModal()}
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
    const addFriendButton = document.getElementById('add-friend-button');
    const searchInput = document.getElementById('friends-search') as HTMLInputElement;

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
        if (action && username) {
          await this.handleFriendAction(action, username);
        }
      });
    });
  }
}