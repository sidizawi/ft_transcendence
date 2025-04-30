import { TranscendenceApp } from './core/app';
import { ChatService } from './shared/services/chatService';

export const chatService = new ChatService();
export const app = new TranscendenceApp();