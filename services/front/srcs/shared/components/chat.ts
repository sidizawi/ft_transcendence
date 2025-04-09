import { User } from '../types/user';
import { TokenManager } from '../utils/token';

export class Chat {
  private userId: string;
  private currentUser: User | null;

  constructor(userId: string) {
    this.userId = userId;
    this.currentUser = TokenManager.getUserFromToken();
  }

  public render(): string {
    return `
      <div class="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white">Chat</h2>
        </div>
        
        <div id="chat-messages" class="h-96 overflow-y-auto p-4 space-y-4">
          <!-- Messages will be populated here -->
        </div>

        <div class="p-4 border-t border-gray-200 dark:border-gray-700">
          <form id="chat-form" class="flex gap-2">
            <input 
              type="text" 
              id="message-input"
              class="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Type your message..."
            >
            <button 
              type="submit"
              class="px-4 py-2 bg-orange dark:bg-nature text-white rounded-lg hover:bg-orange-darker dark:hover:bg-nature/90 transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    `;
  }

  public setupEventListeners(): void {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('message-input') as HTMLInputElement;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input?.value.trim()) return;

      // TODO: Implement actual message sending logic
      this.addMessage({
        text: input.value,
        sender: this.currentUser?.id || 'unknown',
        timestamp: new Date()
      });

      input.value = '';
    });
  }

  private addMessage(message: { text: string; sender: string; timestamp: Date }): void {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    const isOwnMessage = message.sender === this.currentUser?.id;

    messageElement.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`;
    messageElement.innerHTML = `
      <div class="${
        isOwnMessage 
          ? 'bg-orange/10 dark:bg-nature/10' 
          : 'bg-gray-100 dark:bg-gray-700'
      } rounded-lg px-4 py-2 max-w-[80%]">
        <p class="text-gray-800 dark:text-white">${this.escapeHtml(message.text)}</p>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          ${message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}