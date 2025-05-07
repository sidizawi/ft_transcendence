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
      <div class="max-w-2xl mx-auto bg-light-0 dark:bg-dark-4 rounded-lg shadow-md">
      <div class="p-4 border-b border-light-4/40 dark:border-dark-0/40">
        <h2 class="text-xl font-semibold text-light-4 dark:text-dark-0 text-center">
          <a 
            href="/users/${this.friendUserName}"
            class="mx-auto max-w-full truncate overflow-hidden whitespace-nowrap block"
            style="max-width: 80%"
          >
            ${this.friendUserName}
          </a>
        </h2>
      </div>
        
        <div id="chat-messages" class="h-96 overflow-y-auto p-4 space-y-4">
          <!-- Messages will be populated here -->
        </div>

        <div class="p-4 border-t border-light-4/40 dark:border-dark-0/40">
          <form id="chat-form" class="flex gap-2">
            <input 
              type="text" 
              id="message-input"
              class="
                flex-1 rounded-lg p-2
                border border-light-4/30
                dark:border-dark-0/30
                dark:bg-dark-4 <!-- pas de bg light -->
                
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
              "
              placeholder="Type your message..."
            >
            <button 
              type="submit"
              class="px-4 py-2 bg-light-3 dark:bg-dark-1 text-light-0 rounded-lg hover:bg-light-4 dark:hover:bg-dark-0 transition-colors"
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
          ? 'bg-light-3/10 dark:bg-dark-2/10' 
          : 'bg-light-1 dark:bg-dark-3'
      } rounded-lg px-4 py-2 max-w-[80%]">
        <p class="text-gray-800 dark:text-dark-0">${this.escapeHtml(message.text)}</p>
        <p class="text-xs text-gray-500 dark:text-dark-2 mt-1">
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