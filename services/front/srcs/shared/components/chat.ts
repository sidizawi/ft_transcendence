import { ChatService, ChatMessage } from '../services/chatService';
import { i18n } from '../i18n';
import { TokenManager } from '../utils/token';

export class Chat {
  private messages: ChatMessage[] = [];
  private chatService: ChatService;
  private userId: string;

  constructor(private friendId: string, private friendUsername: string) {
    this.chatService = ChatService.getInstance();
    const user = TokenManager.getUserFromToken();
    this.userId = user?.id || '';
    this.initialize();
  }

  private async initialize() {
    try {
      this.messages = await this.chatService.getMessageHistory(this.friendId);
      this.chatService.onMessage(this.handleNewMessage.bind(this));
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  }

  private handleNewMessage(message: ChatMessage) {
    if (message.senderId === this.friendId || message.receiverId === this.friendId) {
      this.messages.push(message);
      this.updateChatMessages();
    }
  }

  private updateChatMessages() {
    const messagesContainer = document.querySelector(`#chat-messages-${this.friendId}`);
    if (messagesContainer) {
      messagesContainer.innerHTML = this.renderMessages();
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }

  private renderMessages(): string {
    return this.messages
      .map(message => {
        const isOwn = message.senderId === this.userId;
        return `
          <div class="flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4">
            <div class="${
              isOwn 
                ? 'bg-orange dark:bg-nature text-white dark:text-nature-lightest' 
                : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
            } rounded-lg px-4 py-2 max-w-[70%] break-words">
              <p>${message.content}</p>
              <span class="text-xs opacity-75 mt-1 block">
                ${this.formatTimestamp(message.timestamp)}
              </span>
            </div>
          </div>
        `;
      })
      .join('');
  }

  render(): string {
    return `
      <div class="flex flex-col h-full">
        <div 
          id="chat-messages-${this.friendId}"
          class="flex-1 overflow-y-auto p-4 space-y-4"
        >
          ${this.renderMessages()}
        </div>
        <div class="p-4 border-t dark:border-gray-700">
          <form id="chat-form-${this.friendId}" class="flex space-x-2">
            <input
              type="text"
              id="chat-input-${this.friendId}"
              class="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange dark:focus:ring-nature focus:border-transparent"
              placeholder="${i18n.t('typeMessage')}"
            >
            <button
              type="submit"
              class="bg-orange dark:bg-nature text-white dark:text-nature-lightest px-4 py-2 rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
              </svg>
            </button>
          </form>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    const form = document.getElementById(`chat-form-${this.friendId}`);
    const input = document.getElementById(`chat-input-${this.friendId}`) as HTMLInputElement;

    form?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = input?.value.trim();
      if (content) {
        try {
          await this.chatService.sendMessage(this.friendId, content);
          input.value = '';
        } catch (error) {
          console.error('Error sending message:', error);
        }
      }
    });
  }

  destroy() {
    this.chatService.removeMessageHandler(this.handleNewMessage.bind(this));
  }
}