export type FriendStatus = 'sending' | 'receiving' | 'accepted' | 'blocked';

export interface Friend {
  userid1: string;
  username1: string;
  userid2: string;
  username2: string;
  status: FriendStatus;
  avatar?: string;
  online: boolean;
}

export interface FriendStatusUpdate {
  type: string;
  friend: string;
  status: boolean;
}
