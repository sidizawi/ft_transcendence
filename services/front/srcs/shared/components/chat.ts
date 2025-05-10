import { User } from '../types/user';
import { TokenManager } from '../utils/token';
import { SVGIcons } from '../../shared/components/svg';
import { app, chatService } from '../../main';

export class Chat {
  private friendUserName: string;
  private currentUser: User | null;
  private isOpen: boolean = true;

  // Adjust these as needed
  private static baseRight = 200; // initial offset from right edge
  private static gap = 20;      // gap between tabs

  private static chatTabs: Map<string, HTMLDivElement> = new Map();

  constructor(friendUserName: string) {
    this.friendUserName = friendUserName;
    this.currentUser = TokenManager.getUserFromLocalStorage();

    // Subscribe to incoming messages and history responses
    chatService.addNewChatRoom(this.friendUserName, (data) => this.receiveMessage(data));
  }

  receiveMessage(data: any) {
    if (data.type === 'message') {
      this.addMessage({
        text: data.text,
        sender: data.sender,
        timestamp: new Date(data.timestamp),
      });
    } else if (data.type === 'messages') {
      data.messages.forEach((message: any) => {
        this.addMessage({
          text: message.text,
          sender: message.sender,
          timestamp: new Date(message.timestamp),
        });
      });
    }
  }

  static openChatTab(username: string): void {
    // If already open, re-show, focus, and reload history
    if (this.chatTabs.has(username)) {
      const existingTab = this.chatTabs.get(username)!;
      existingTab.style.display = 'block';

      // Ensure it's expanded
      const chatContent = existingTab.querySelector<HTMLDivElement>('.chat-content');
      if (chatContent?.classList.contains('hidden')) {
        chatContent.classList.remove('hidden');
        const toggleBtn = existingTab.querySelector<HTMLButtonElement>('.toggle-chat');
        toggleBtn?.setAttribute('aria-expanded', 'true');
      }

      // Scroll into view
      existingTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });

      // Focus the input
      const input = existingTab.querySelector<HTMLInputElement>('.message-input');
      input?.focus();

      return;
    }

    // Create new chat tab container
    const chatTab = document.createElement('div');
    chatTab.className = 'chat-tab fixed bottom-10 z-40';
    chatTab.setAttribute('data-username', username);
    chatTab.style.minWidth = '300px';

    // Instantiate Chat which subscribes and will render history
    const chat = new Chat(username);

    // Render UI and append
    chatTab.innerHTML = chat.render();
    document.body.appendChild(chatTab);

    // Measure and lock width
    const tabWidth = chatTab.getBoundingClientRect().width;
    chatTab.style.width = `${tabWidth}px`;

    // Position new tab
    const index = this.chatTabs.size;
    const position = this.baseRight + index * (tabWidth + this.gap);
    chatTab.style.right = `${position}px`;

    // Add play icon
    const gameButton = document.createElement('button');
    gameButton.className = `absolute top-4 left-6 p-1 w-5 h-5 text-light-0 dark:text-dark-4 hover:scale-110`
    gameButton.innerHTML = SVGIcons.getGameIcon();
    gameButton.addEventListener('click', () => {
      // todo: translate
      chat.sendMessage(`<a href="https://${window.location.hostname}:8080/pong/online?friend=${chat.currentUser?.username}">\
        ${chat.currentUser?.username} is invinting you to play a pong game</a>`
      , "game");
      app.router.navigateTo(`/pong/online?friend=${username}`);
    });
    const headerBtn = chatTab.querySelector('.toggle-chat');
    if (headerBtn) headerBtn.appendChild(gameButton);

    // Add redirect to friend
    const redirectLink = document.createElement("a");
    redirectLink.className = "inline-block truncate max-w-[80%] text-center text-light-0 dark:text-dark-4 hover:underline";
    redirectLink.innerText = chat.friendUserName;
    redirectLink.href = `/users/${chat.friendUserName}`;
    if (headerBtn) headerBtn.appendChild(redirectLink);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = `absolute top-4 right-6 p-1 w-5 h-5 text-light-0 dark:text-dark-4 hover:scale-110`
    closeButton.innerHTML = SVGIcons.getRejectIcon();
    closeButton.addEventListener('click', () => {
      chatTab.remove();
      this.chatTabs.delete(username);
      this.repositionTabs();
    });
    if (headerBtn) headerBtn.appendChild(closeButton);

    // Set up UI interactions
    const toggleBtn = chatTab.querySelector<HTMLButtonElement>('.toggle-chat')!;
    const chatContent = chatTab.querySelector<HTMLDivElement>('.chat-content')!;
    const form = chatTab.querySelector<HTMLFormElement>('.chat-form')!;
    const input = chatTab.querySelector<HTMLInputElement>('.message-input')!;

    toggleBtn.addEventListener('click', () => {
      chat.isOpen = !chat.isOpen;
      chatContent.classList.toggle('hidden');
      toggleBtn.setAttribute('aria-expanded', String(chat.isOpen));

      if (chat.isOpen) {
        // allow the browser to reflow the now-visible container
        setTimeout(() => {
          const msgs = chatContent.querySelector<HTMLDivElement>('.chat-messages')!;
          msgs.scrollTop = msgs.scrollHeight;
        }, 0);
      }
    });
    const link = toggleBtn.querySelector('a');
    link?.addEventListener('click', (e) => e.stopPropagation());

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input.value.trim()) return;

      chat.sendMessage(input.value);
      input.value = '';
    });

    this.chatTabs.set(username, chatTab);
  }

  private sendMessage(message: string, tp: string = "message") {
    const timestamp = new Date();
    this.addMessage({
      text: this.escapeHtml(message),
      sender: this.currentUser?.username || 'unknown',
      timestamp,
    });
    chatService.sendMessage(
      JSON.stringify({
        type: tp,
        text: message,
        user: this.currentUser?.username,
        userId: this.currentUser?.id,
        friend: this.friendUserName,
        timestamp,
      })
    );
  }

  private static repositionTabs(): void {
    let index = 0;
    this.chatTabs.forEach((tab) => {
      const width = parseFloat(tab.style.width);
      const position = this.baseRight + index * (width + this.gap);
      tab.style.right = `${position}px`;
      index++;
    });
  }

  public render(): string {
    return `
      <div class="max-w-2xl mx-auto bg-light-0 dark:bg-dark-4 shadow-md">

        <button
          class="toggle-chat w-full text-xl p-4 border-b rounded-t-md
            border-light-4/40 dark:border-dark-0/40
            bg-light-3 dark:bg-dark-1
            text-light-0 dark:text-dark-3
            hover:bg-light-4 dark:hover:bg-dark-0
            transition-colors flex items-center justify-center"
          aria-expanded="${this.isOpen}"
        >
        </button>

        <div class="chat-content ${this.isOpen ? '' : 'hidden'}">
          <div class="chat-messages h-96 overflow-y-auto p-4 space-y-4">
            <!-- Messages will be populated here -->
          </div>
          <div class="p-4 border-t border-light-4/40 dark:border-dark-0/40">
            <form class="chat-form flex gap-2">
              <input
                type="text"
                class="message-input flex-1 rounded-lg p-2
                  border border-light-4/30
                  dark:border-dark-0/30
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
                  dark:focus:ring-dark-4"
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
      </div>
    `;
  }

  private addMessage(message: { text: string; sender: string; timestamp: Date }): void {
    const selector = `.chat-tab[data-username="${this.friendUserName}"] .chat-messages`;
    const messagesContainer = document.querySelector<HTMLDivElement>(selector);
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    const isOwnMessage = message.sender === this.currentUser?.username;

    messageElement.className = `flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`;
    messageElement.innerHTML = `
      <div class="${
        isOwnMessage ? 'bg-light-3/10 dark:bg-dark-2/10' : 'bg-light-1 dark:bg-dark-3'
      } rounded-lg px-4 py-2 max-w-[80%]">
        <p class="text-gray-800 dark:text-dark-0">${message.text}</p>
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
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}