
export interface User {
  id: string;
  uid: string; // Unique Display ID (e.g. "88001")
  username: string; // Login Account Name (Immutable)
  displayName?: string; // Public Nickname (Mutable)
  password?: string;
  age: number;
  contactType: 'wechat' | 'phone';
  contactValue: string;
  registeredAt: string;
  isDeleted?: boolean;
  lastActiveAt?: string; // ISO Timestamp for online status
  
  // Ban / Risk Control
  isBanned?: boolean;
  banExpiresAt?: string; // ISO Timestamp when ban ends
  
  // Social features
  likes: number;
  bio?: string;
  friends: string[]; // List of friend User IDs
  friendRequests: string[]; // List of User IDs who sent a request
  photos: string[]; // List of photo URLs
}

export interface ChatMessage {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  timestamp: string;
}

export interface InvitationCode {
  id: string;
  code: string;
  isUsed: boolean;
  usedBy?: string;
  createdAt: string;
}

export interface InvitationCodeResponse {
  code: string;
}

export type PasswordRequestType = 'RESET' | 'RETRIEVE';

export interface PasswordRequest {
  id: string;
  username: string;
  requestType: PasswordRequestType;
  newPassword?: string; // The password user wants to set
  contactInfo: string; // Combined string or JSON of contact details
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
}

export interface BanAppeal {
  id: string;
  username: string; // The login account name
  userId: string;
  contactInfo: string;
  status: 'PENDING' | 'RESOLVED';
  createdAt: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  isImportant?: boolean;
}

export enum ViewState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  ADMIN_LOGIN = 'ADMIN_LOGIN',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  NOTICE_BOARD = 'NOTICE_BOARD', // New View
  // App Views
  APP_LOBBY = 'APP_LOBBY',
  APP_LEADERBOARD = 'APP_LEADERBOARD',
  APP_FRIENDS = 'APP_FRIENDS',
  APP_PROFILE = 'APP_PROFILE',
}