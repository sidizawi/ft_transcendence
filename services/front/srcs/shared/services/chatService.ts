import { User } from "../types/user";
import { TokenManager } from "../utils/token";

const CHAT_WS = `ws://${window.location.hostname}:3000/chat/message`;

// todo: check if the token is removed to logout the user
export class ChatService {
  private ws: WebSocket | null = null;
  private currentUser: User | null = null;
  private chatRooms : Map<string, (data: any) => void> = new Map();
  private chatMessages : any[] = [];

  public setuped : boolean = false;

  constructor() {
    this.currentUser = TokenManager.getUserFromLocalStorage();

    if (!this.currentUser) {
      this.setuped = false;
      return;
    }

    this.setup();
  }

  clean() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setuped = false;
  }

  setup() {
    if (this.setuped) {
      return;
    }

    const token = TokenManager.getToken();
    if (!token) {
      return;
    }

    this.ws = new WebSocket(`${CHAT_WS}${token ? `?token=${token}` : ""}`);

    this.ws.onopen = () => {
      this.ws!.send(JSON.stringify({
        type: "new",
        userId: this.currentUser?.id,
        user: this.currentUser?.username,
      }));

      this.chatRooms.forEach((fn, friendUserName) => {
        this.ws?.send(JSON.stringify({
          type: "newChat",
          user: this.currentUser?.username,
          userId: this.currentUser?.id,
          friend: friendUserName,
        }));
      })
    }

    this.ws.onmessage = (event) => {
      let data = JSON.parse(event.data.toString());

      console.log("data received:", data);
      if (data.type == "message") {
        this.chatRooms.get(data.friend)?.(data);
      } else if (data.type == "messages") {
        this.chatRooms.get(data.friend)?.(data);
      }
    }

    this.setuped = true;
  }

  addNewChatRoom(friendUserName: string, callback: (data: any) => void) {
    if (this.chatRooms.has(friendUserName)) {
      return;
    }
    this.chatRooms.set(friendUserName, callback);

    if (this.ws?.readyState !== WebSocket.OPEN) {
      return ;
    }

    this.ws.send(JSON.stringify({
      type: "newChat",
      user: this.currentUser?.username,
      userId: this.currentUser?.id,
      friend: friendUserName,
    }));
  }

  sendMessage(data: any) {
    if (!this.setuped) {
      return;
    }
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.chatMessages.push(data);
      return ;
    }
    if (this.chatMessages.length > 0) {
      this.chatMessages.forEach((message) => {
        this.ws?.send(message);
      });
      this.chatMessages = [];
    }
    this.ws.send(data);
  }
}
