import { User } from '../../shared/types/user';
import { Friend } from '../../shared/types/friend';
import { FriendService } from '../../shared/services/friendService';
import { i18n } from '../../shared/i18n';
import { FriendProfile } from '../profile/friendProfile';

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
    
    if (!this.searchQuery) {
      return this.friends;
    }

    const searchTerm = this.searchQuery.toLowerCase();
    return this.friends.filter(friend => 
      friend.username2.toLowerCase().includes(searchTerm)
    );
  }

  private openChatInNewTab(userId: string) {
    const chatUrl = `/chat/${userId}`;
    const chatWindow = window.open(chatUrl, `chat-${userId}`, 'width=800,height=600');
    if (chatWindow) {
      chatWindow.focus();
    }
  }

  private navigateToProfile(username: string) {
    window.history.pushState(null, '', `/users/${username}`); //////// TO check
    const friendProfile = new FriendProfile(username, this.getFriendAvatar(username));
    const main = document.querySelector('main');
    if (main) {
      main.innerHTML = friendProfile.render();
      friendProfile.setupEventListeners();
    }
  }

  private getFriendAvatar(username: string): string {
    const friend = this.friends.find(f => f.username2 === username);
    return friend?.avatar || '/img/default-avatar.jpg';
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
            <div id="add-friend-error" class="text-red-400 text-sm hidden"></div>
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
    const sendingRequests = filteredFriends.filter(f => f.status === 'sending');
    const acceptedFriends = filteredFriends.filter(f => f.status === 'accepted');
    const blockedFriends = filteredFriends.filter(f => f.status === 'blocked');

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

          <input
            type="text"
            id="friends-search"
            placeholder="${i18n.t('searchFriends')}"
            value="${this.searchQuery}"
            class="w-full p-3 mb-6 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange dark:focus:ring-nature"
          />

          ${receivingRequests.length > 0 ? `
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${i18n.t('incomingRequests')}</h3>
              <div class="space-y-3">
                ${receivingRequests.map(friend => `
                  <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div class="flex items-center space-x-3 cursor-pointer" data-action="view-profile" data-username="${friend.username2}">
                      <img 
                        src="${friend.avatar}" 
                        alt="${friend.username2}" 
                        class="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
                      >
                      <span class="text-gray-900 dark:text-white hover:underline">${friend.username2}</span>
                    </div>
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

          ${sendingRequests.length > 0 ? `
            <div class="mb-8">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${i18n.t('outgoingRequests')}</h3>
              <div class="space-y-3">
                ${sendingRequests.map(friend => `
                  <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div class="flex items-center space-x-3 cursor-pointer" data-action="view-profile" data-username="${friend.username2}">
                      <img 
                        src="${friend.avatar}" 
                        alt="${friend.username2}" 
                        class="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
                      >
                      <span class="text-gray-900 dark:text-white hover:underline">${friend.username2}</span>
                    </div>
                    <button 
                      class="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded text-white transition-colors"
                      data-action="cancel"
                      data-username="${friend.username2}"
                    >
                      ${i18n.t('cancel')}
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="mb-8">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${i18n.t('friendsList')}</h3>
            ${acceptedFriends.length > 0 ? `
              <div class="space-y-3">
                ${acceptedFriends.map(friend => `
                  <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div class="flex items-center space-x-3 cursor-pointer" data-action="view-profile" data-username="${friend.username2}">
                      <div class="relative">
                        <img 
                          src="${friend.avatar}" 
                          alt="${friend.username2}" 
                          class="w-10 h-10 rounded-full object-cover hover:opacity-80 transition-opacity"
                        >
                        <span class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                      </div>
                      <span class="text-gray-900 dark:text-white hover:underline">${friend.username2}</span>
                    </div>
                    <div class="flex items-center space-x-3">
                      <button 
                        class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        data-action="block"
                        data-username="${friend.username2}"
                        title="${i18n.t('block')}"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                      <button 
                        class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        data-action="delete"
                        data-username="${friend.username2}"
                        title="${i18n.t('delete')}"
                      >
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                      <button 
                        class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        data-action="chat"
                        data-userid="${friend.userid2}"
                        title="${i18n.t('chat')}"
                      >
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
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

          ${blockedFriends.length > 0 ? `
            <div class="mt-8">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">${i18n.t('blockedUsers')}</h3>
              <div class="space-y-3">
                ${blockedFriends.map(friend => `
                  <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div class="flex items-center space-x-3 cursor-pointer" data-action="view-profile" data-username="${friend.username2}">
                      <img 
                        src="${friend.avatar}" 
                        alt="${friend.username2}" 
                        class="w-10 h-10 rounded-full object-cover grayscale hover:opacity-80 transition-opacity"
                      >
                      <span class="text-gray-900 dark:text-white hover:underline">${friend.username2}</span>
                    </div>
                    <button 
                      class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded border border-gray-300 dark:border-gray-600"
                      data-action="unblock"
                      data-username="${friend.username2}"
                    >
                      ${i18n.t('unblock')}
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="mt-8 flex justify-center">
          <a 
            href="/profile"
            class="px-6 py-2 bg-orange-lighter dark:bg-forest text-orange-darker dark:text-nature-lightest rounded-lg hover:bg-orange-lighter/90 dark:hover:bg-forest/90 transition-colors"
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

  private async handleFriendAction(action: string, username: string, userId?: string) {
    try {
      if (action === 'chat' && userId) {
        this.openChatInNewTab(userId);
        return;
      }

      if (action === 'view-profile') {
        this.navigateToProfile(username);
        return;
      }

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
        case 'unblock':
          await FriendService.unblockFriend(username);
          break;
        case 'delete':
          await FriendService.deleteFriend(username);
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
        e.preventDefault();
        e.stopPropagation();
        const action = button.getAttribute('data-action');
        const username = button.getAttribute('data-username');
        const userId = button.getAttribute('data-userid');

        if (action && username) {
          await this.handleFriendAction(action, username, userId);
        }
      });
    });
  }
}