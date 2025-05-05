import { User } from '../../shared/types/user';
import { Friend } from '../../shared/types/friend';
import { FriendService } from '../../shared/services/friendService';
import { i18n } from '../../shared/i18n';
import { FriendProfile } from '../profile/friendProfile';
import { SVGIcons } from '../../shared/components/svg';

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

  private openChatInNewTab(username: string) {
    const chatUrl = `/chat/${username}`;
    const chatWindow = window.open(chatUrl, `chat-${username}`, 'width=800,height=600');
    if (chatWindow) {
      chatWindow.focus();
    }
  }

  private navigateToProfile(username: string) {
    window.history.pushState(null, '', `/users/${username}`);
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
        <div class="bg-light-0 dark:bg-dark-4 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
          <h3 class="text-xl font-bold mb-4 text-light-4 dark:text-dark-0">
            ${i18n.t('addFriend')}
          </h3>
          <form id="add-friend-form" class="space-y-4">
            <div>
              <input 
                type="text" 
                id="friend-username"
                class="
                  mt-1 block w-full
                  rounded-md

                  border border-light-4/30
                  dark:border-dark-0/30
                  bg-white <!-- why not working>
                  dark:bg-dark-4
                  
                  placeholder-light-4/40
                  dark:placeholder-dark-0/40
                  text-light-4
                  dark:text-dark-0

                  focus:outline-none

                  focus:border-light-3
                  dark:focus:border-dark-1
                  focus:ring-2
                  focus:ring-light-0
                  dark:focus:ring-dark-4

                  px-3 py-2

                  text-base
                "                                      
                placeholder="${i18n.t('enterUsername')}"
                required
                ${this.isAddingFriend ? 'disabled' : ''}
              >
            </div>
            <div id="add-friend-error" class="mt-4 p-4 rounded-lg hidden"></div>
            <div class="flex justify-end space-x-3">
              <button 
                type="button"
                id="cancel-add-friend"
                class="px-4 py-2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0"
                ${this.isAddingFriend ? 'disabled' : ''}
              >
                ${i18n.t('cancel')}
              </button>
              <button 
                type="submit"
                class="px-4 py-2 bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 relative"
                ${this.isAddingFriend ? 'disabled' : ''}
              >
                <span class="add-friend-text ${this.isAddingFriend ? 'invisible' : ''}">${i18n.t('add')}</span>
                ${this.isAddingFriend ? `
                  <span class="absolute inset-0 flex items-center justify-center">
                    ${SVGIcons.getLoadingIcon()}
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
        <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
          <div class="max-w-4xl mx-auto px-4 py-8">
            <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-6">
              <div class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-light-3 dark:border-dark-1 border-t-transparent"></div>
              </div>
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
      <div class="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-4">
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="bg-light-0 dark:bg-dark-4 rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
              <h1 class="text-2xl font-bold text-light-4 dark:text-dark-0">${i18n.t('friends')}</h1>
              <button 
                id="add-friend-button"
                class="bg-light-3 dark:bg-dark-1 text-light-0 dark:text-dark-4 px-4 py-2 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors"
              >
                ${i18n.t('add')}
              </button>
            </div>

            <input
              type="text"
              id="friends-search"
              placeholder="${i18n.t('searchFriends')}"
              value="${this.searchQuery}"
              class="
                w-full p-3 mb-6 rounded-lg
                bg-light-1 dark:bg-dark-3
                text-light-4 dark:text-dark-0
                placeholder-light-3/60 dark:placeholder-dark-1/60
                focus:outline-none focus:ring-2
                focus:ring-light-3 dark:focus:ring-dark-1
              "
            />

            ${receivingRequests.length > 0 ? `
              <div class="mb-8">
                <h3 class="text-lg font-semibold text-light-4 dark:text-dark-0 mb-4">${i18n.t('receivedRequests')}</h3>
                <div class="space-y-3">
                  ${receivingRequests.map(friend => `
                    <div class="flex items-center justify-between p-4 bg-light-1 dark:bg-dark-3 rounded-lg">
                      <div class="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity max-w-[70%]" data-action="view-profile" data-username="${friend.username2}">
                        <img 
                          src="${friend.avatar}" 
                          alt="${friend.username2}" 
                          class="w-10 h-10 rounded-full object-cover shrink-0"
                        >
                        <span class="text-light-4 dark:text-dark-0 truncate overflow-hidden whitespace-nowrap block">
                          ${friend.username2}
                        </span>
                      </div>
                      <div class="space-x-2">
                        <button 
                        class="
                            text-light-4/80 dark:text-dark-0/80
                            px-3 py-1.5 rounded-lg
                            border border-light-4/80 dark:border-dark-0/80
                            hover:text-light-0 dark:hover:text-dark-4
                            hover:border-light-0 dark:hover:border-dark-4
                            hover:bg-light-4 dark:hover:bg-dark-0
                            transition-colors
                          "
                          data-action="accept"
                          data-username="${friend.username2}"
                        >
                          ${SVGIcons.getAcceptIcon()}
                        </button>
                        <button 
                          class="
                            text-light-4/80 dark:text-dark-0/80
                            px-3 py-1.5 rounded-lg
                            border border-light-4/80 dark:border-dark-0/80
                            hover:text-light-0 dark:hover:text-dark-4
                            hover:border-light-0 dark:hover:border-dark-4
                            hover:bg-light-4 dark:hover:bg-dark-0
                            transition-colors
                          "
                          data-action="reject"
                          data-username="${friend.username2}"
                        >
                          ${SVGIcons.getRejectIcon()}
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            ${sendingRequests.length > 0 ? `
              <div class="mb-8">
                <h3 class="text-lg font-semibold text-light-4 dark:text-dark-0 mb-4">${i18n.t('sentRequests')}</h3>
                <div class="space-y-3">
                  ${sendingRequests.map(friend => `
                    <div class="flex items-center justify-between p-4 bg-light-1 dark:bg-dark-3 rounded-lg">
                      <div class="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity max-w-[80%]" data-action="view-profile" data-username="${friend.username2}">
                        <img 
                          src="${friend.avatar}" 
                          alt="${friend.username2}" 
                          class="w-10 h-10 rounded-full object-cover shrink-0"
                        >
                        <span class="text-light-4 dark:text-dark-0 truncate overflow-hidden whitespace-nowrap block">
                          ${friend.username2}
                        </span>
                      </div>
                      <div class="flex items-center space-x-3">
                      <button 
                        class="
                            text-light-4/80 dark:text-dark-0/80
                            px-3 py-1.5 rounded-lg
                            border border-light-4/80 dark:border-dark-0/80
                            hover:text-light-0 dark:hover:text-dark-4
                            hover:border-light-0 dark:hover:border-dark-4
                            hover:bg-light-4 dark:hover:bg-dark-0
                            transition-colors
                          "
                        data-action="cancel"
                        data-username="${friend.username2}"
                      >
                        ${i18n.t('cancel')}
                      </button>
                    </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <div class="mb-8">
              <h3 class="text-lg font-semibold text-light-4 dark:text-dark-0 mb-4">${i18n.t('friendsList')}</h3>
              ${acceptedFriends.length > 0 ? `
                <div class="space-y-3">
                  ${acceptedFriends.map(friend => `
                    <div class="flex items-center justify-between p-4 bg-light-1 dark:bg-dark-3 rounded-lg">
                      <div class="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity max-w-[80%]" data-action="view-profile" data-username="${friend.username2}">
                        <img 
                          src="${friend.avatar}" 
                          alt="${friend.username2}" 
                          class="w-10 h-10 rounded-full object-cover shrink-0"
                        >
                        <span class="text-light-4 dark:text-dark-0 truncate overflow-hidden whitespace-nowrap block">
                          ${friend.username2}
                        </span>
                      </div>
                      <div class="flex items-center space-x-3">
                        <button 
                          class="text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0 transition-colors"
                          data-action="block"
                          data-username="${friend.username2}"
                          title="${i18n.t('block')}"
                        >
                          ${SVGIcons.getBlockIcon()}
                        </button>
                        <button 
                          class="text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0 transition-colors"
                          data-action="delete"
                          data-username="${friend.username2}"
                          title="${i18n.t('delete')}"
                        >
                          ${SVGIcons.getDeleteIcon()}
                        </button>
                        <button 
                          class="text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0 transition-colors"
                          data-action="chat"
                          data-username="${friend.username2}"
                          title="${i18n.t('chat')}"
                        >
                          ${SVGIcons.getChatIcon()}
                        </button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p class="text-light-4/80 dark:text-dark-0/80 text-center py-8">
                  ${i18n.t('noFriendsYet')}
                </p>
              `}
            </div>

            ${blockedFriends.length > 0 ? `
              <div class="mt-8">
                <h3 class="text-lg font-semibold text-light-4 dark:text-dark-0 mb-4">${i18n.t('blockedUsers')}</h3>
                <div class="space-y-3">
                  ${blockedFriends.map(friend => `
                    <div class="flex items-center justify-between p-4 bg-light-1 dark:bg-dark-3 rounded-lg">
                      <div class="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity max-w-[80%]" data-action="view-profile" data-username="${friend.username2}">
                        <img 
                          src="${friend.avatar}" 
                          alt="${friend.username2}" 
                          class="w-10 h-10 rounded-full object-cover shrink-0"
                        >
                        <span class="text-light-4 dark:text-dark-0 truncate overflow-hidden whitespace-nowrap block">
                          ${friend.username2}
                        </span>
                      </div>
                      <button 
                        class="
                          text-light-4/80 dark:text-dark-0/80
                          px-3 py-1.5 rounded-lg
                          border border-light-4/80 dark:border-dark-0/80
                          hover:text-light-0 dark:hover:text-dark-4
                          hover:border-light-0 dark:hover:border-dark-4
                          hover:bg-light-4 dark:hover:bg-dark-0
                          transition-colors
                        "
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
          
          <!-- Back Button -->
          <div class="mt-8 flex justify-center">
            <a 
              href="/profile"
              class="px-6 py-2 text-light-4/80 dark:text-dark-0/80 hover:text-light-4 dark:hover:text-dark-0 rounded-lg transition-colors"
            >
              ${i18n.t('back')}
            </a>
          </div>
        </div>
      </div>
      ${this.renderAddFriendModal()}
    `;
  }

  private showAddFriendError(message: string) {
    const errorAddMessage = document.getElementById('add-friend-error');
    if (errorAddMessage) {
      errorAddMessage.textContent = message;
      errorAddMessage.className = 'mt-4 p-4 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/50 text-center dark:text-red-400';
      errorAddMessage.classList.remove('hidden');
    }
  }

  private hideAddFriendError() {
    const errorDiv = document.getElementById('add-friend-error');
    if (errorDiv) {
      errorDiv.classList.add('hidden');
    }
  }

  private async handleAddFriend(username: string) {
    this.updateView();
  
    try {
      this.isAddingFriend = true;
      await FriendService.addFriend(username);
      this.addFriendOpen = false;
      await this.loadFriends();
    } catch (error) {
      this.isAddingFriend = false;
      this.showAddFriendError(error instanceof Error ? error.message : 'Failed to add friend');
      return;
    }
  
    this.isAddingFriend = false;
    this.updateView();
  }
  
  

  private async handleFriendAction(action: string, username: string) {
    try {
      if (action === 'chat' && username) {
        this.openChatInNewTab(username);
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

      // inform friendList changed
      window.dispatchEvent(new CustomEvent('friendListChanged', {
        detail: { username, action }
      }));
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

        if (action && username) {
          await this.handleFriendAction(action, username);
        }
      });
    });
  }
}