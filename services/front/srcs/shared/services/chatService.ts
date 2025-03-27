import { io, Socket } from 'socket.io-client';
import { TokenManager } from '../utils/token';

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
}

export class ChatService {
  private static instance: ChatService;
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];

  private constructor() {
    this.connect();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  private connect() {
    const token = TokenManager.getToken();
    if (!token) return;

    this.socket = io('http://localhost:3003', {
      auth: {
        token
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('chat_message', (message: ChatMessage) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('error', (error: any) => {
      console.error('Chat socket error:', error);
    });
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: ChatMessage) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  async sendMessage(receiverId: string, content: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('send_message', { receiverId, content }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  async getMessageHistory(friendId: string): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`http://localhost:3003/chat/history/${friendId}`, {
        headers: TokenManager.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch message history');
      }

      const data = await response.json();
      return data.messages;
    } catch (error) {
      console.error('Error fetching message history:', error);
      return [];
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}