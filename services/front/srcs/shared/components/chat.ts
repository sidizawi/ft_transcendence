import { chatService } from '../../main';
import { User } from '../types/user';
import { TokenManager } from '../utils/token';

export class Chat {
  private friendUserName: string;
  private currentUser: User | null;

  constructor(friendUserName: string) {
    this.friendUserName = decodeURI(friendUserName);
    this.currentUser = TokenManager.getUserFromLocalStorage();

    chatService.addNewChatRoom(this.friendUserName, (data) => this.receiveMessage(data));
  }

  receiveMessage(data: any) {
    console.log("chat received: ", data);
    if (data.type == "message") {
      this.addMessage({
        text: data.text,
        sender: data.sender,
        timestamp: new Date(data.timestamp)
      });
    } else if (data.type == "messages") {
      data.messages.map((message: any) => {
        this.addMessage({
          text: message.text,
          sender: message.sender,
          timestamp: new Date(message.timestamp),
        });
      })
    }
  }

  render(): string {
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

  setupEventListeners(): void {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('message-input') as HTMLInputElement;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input?.value.trim()) return;

      const timestamp = new Date();
      this.addMessage({
        text: input.value,
        sender: this.currentUser?.username || 'unknown',
        timestamp: timestamp
      });

      chatService.sendMessage(JSON.stringify({
        type: "message",
        text: input.value,
        user: this.currentUser?.username,
        userId: this.currentUser?.id,
        friend: this.friendUserName,
        timestamp
      }));

      input.value = '';
    });
  }

  private addMessage(message: { text: string; sender: string; timestamp: Date }): void {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    const isOwnMessage = message.sender === this.currentUser?.username;

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