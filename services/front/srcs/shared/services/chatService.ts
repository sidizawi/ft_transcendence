import { io, Socket } from 'socket.io-client';
import { TokenManager } from '../utils/token';

const host = window.location.hostname;
const CHAT_API_URL = `https://${host}:8080/api/chat/message`;

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  senderUsername: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  otherUserId: string;
  otherUsername: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

export class ChatService {
  private static instance: ChatService;
  private socket: Socket | null = null;
  private messageHandlers: ((message: ChatMessage) => void)[] = [];
  private typingHandlers: ((data: { senderId: string, senderUsername: string }) => void)[] = [];
  private errorHandlers: ((error: string) => void)[] = [];
  private messageSentHandlers: ((data: { id: string, recipientId: string, content: string, timestamp: Date }) => void)[] = [];

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

    this.socket = io(`${CHAT_API_URL}`, {
      auth: {
        token
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.errorHandlers.forEach(handler => handler('Failed to connect to chat server'));
    });

    this.socket.on('private-message', (message: ChatMessage) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('user-typing', (data: { senderId: string, senderUsername: string }) => {
      this.typingHandlers.forEach(handler => handler(data));
    });

    this.socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error);
      this.errorHandlers.forEach(handler => handler(error.message));
    });

    this.socket.on('message-sent', (data: { id: string, recipientId: string, content: string, timestamp: Date }) => {
      this.messageSentHandlers.forEach(handler => handler(data));
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });
  }

  onMessage(handler: (message: ChatMessage) => void) {
    this.messageHandlers.push(handler);
  }

  onTyping(handler: (data: { senderId: string, senderUsername: string }) => void) {
    this.typingHandlers.push(handler);
  }

  onError(handler: (error: string) => void) {
    this.errorHandlers.push(handler);
  }

  onMessageSent(handler: (data: { id: string, recipientId: string, content: string, timestamp: Date }) => void) {
    this.messageSentHandlers.push(handler);
  }

  removeMessageHandler(handler: (message: ChatMessage) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  removeTypingHandler(handler: (data: { senderId: string, senderUsername: string }) => void) {
    this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
  }

  removeErrorHandler(handler: (error: string) => void) {
    this.errorHandlers = this.errorHandlers.filter(h => h !== handler);
  }

  removeMessageSentHandler(handler: (data: { id: string, recipientId: string, content: string, timestamp: Date }) => void) {
    this.messageSentHandlers = this.messageSentHandlers.filter(h => h !== handler);
  }

  async sendMessage(recipientId: string, content: string): Promise<void> {
    if (!this.socket?.connected) {
      throw new Error('Not connected to chat server');
    }

    try {
      this.socket.emit('private-message', { recipientId, content });
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  sendTypingIndicator(recipientId: string) {
    if (this.socket?.connected) {
      try {
        this.socket.emit('typing', { recipientId });
      } catch (error) {
        console.error('Error sending typing indicator:', error);
      }
    }
  }

  async getMessageHistory(userId: string): Promise<ChatMessage[]> {
    try {
      console.log('Fetching message history for userId:', userId); //////////////////
      if (!userId) {
        console.error('Invalid userId provided to getMessageHistory');
        return [];
      }

      const response = await fetch(`${CHAT_API_URL}/message/history/${userId}`, {
        headers: TokenManager.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch message history');
      }

      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Error fetching message history:', error);
      return [];
    }
  }

  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${CHAT_API_URL}/message/conversations`, {
        headers: TokenManager.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      return data.conversations || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
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