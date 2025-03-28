export type FriendStatus = 'sending' | 'receiving' | 'accepted' | 'blocked';

export interface Friend {
  userid1: string;
  userid2: string;
  username1: string;
  username2: string;
  status: FriendStatus;
}