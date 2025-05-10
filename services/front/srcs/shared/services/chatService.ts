import { app } from "../../main";
import { User } from "../types/user";
import { TokenManager } from "../utils/token";

const host = window.location.hostname;
const CHAT_WS = `wss://${host}:8080/ws/chat/message`;

/**
 * ChatService handles WebSocket messaging and history retrieval via WS 'newChat' control frames.
 */
export class ChatService {
  private ws: WebSocket | null = null;
  private currentUser: User | null = null;
  private chatRooms: Map<string, (data: any) => void> = new Map();
  private chatQueue: string[] = [];
  public setuped: boolean = false;

  constructor() {
    this.currentUser = TokenManager.getUserFromLocalStorage();
    this.setup();
  }

  /**
   * Close WS and reset state
   */
  public clean() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setuped = false;
  }

  /**
   * Establish WebSocket connection and register handlers
   */
  public setup() {
    if (this.setuped) return;
    const token = TokenManager.getToken();
    if (!token) return;
    
    this.ws = new WebSocket(`${CHAT_WS}?token=${token}`);

    this.ws.onopen = () => {
      this.setuped = true;

      if (!this.currentUser) {
        this.currentUser = TokenManager.getUserFromLocalStorage();
        if (!this.currentUser) {
          this.clean();
          // todo: check if redirect to login is needed
          return ;
        }
      }

      // register session
      this.ws!.send(JSON.stringify({
        type: "new",
        userId: this.currentUser.id,
        user: this.currentUser.username,
      }));

      // flush any queued control or message frames
      this.chatQueue.forEach((frame) => this.ws?.send(frame));
      this.chatQueue = [];
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data.toString());
      // for both 'message' and 'messages', dispatch to handler
      if (data.type === "message" || data.type === "messages") {
        this.chatRooms.get(data.friend)?.(data);
      } else if (data.type == "friendStatus") {
        if (app.friendsTab) {
          app.friendsTab.updateFriendStatus(data);
        }
      }
    };

    this.ws.onclose = () => {
      this.setuped = false;
    };
  }

  /**
   * Subscribe to a chat room, invoking callback on incoming data.
   * Also triggers history load.
   */
  public addNewChatRoom(friendUserName: string, callback: (data: any) => void) {
    if (!this.chatRooms.has(friendUserName)) {
      this.chatRooms.set(friendUserName, callback);
    }
    // request history immediately
    this.requestHistory(friendUserName);
  }

  /**
   * Sends a text message over WS, or queues if not ready
   */
  public sendMessage(data: string) {
    if (!this.setuped || this.ws?.readyState !== WebSocket.OPEN) {
      this.chatQueue.push(data);
      return;
    }
    // flush any queued frames first
    if (this.chatQueue.length) {
      this.chatQueue.forEach((frame) => this.ws?.send(frame));
      this.chatQueue = [];
    }
    this.ws.send(data);
  }

  /**
   * Request full history from backend via WS control frame
   */
  public requestHistory(friendUserName: string) {
    const payload = JSON.stringify({
      type: "newChat",
      user: this.currentUser!.username,
      userId: this.currentUser!.id,
      friend: friendUserName,
    });
    if (this.setuped && this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      // will be sent on next onopen
      this.chatQueue.push(payload);
    }
  }
}
