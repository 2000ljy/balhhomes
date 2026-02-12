import { User, InvitationCode, ChatMessage, PasswordRequest, Notice, BanAppeal } from '../types';

const USERS_KEY = 'bhd_real_users_v1';
const INVITES_KEY = 'bhd_real_invites_v1';
const MESSAGES_KEY = 'bhd_real_messages_v1';
const CURRENT_USER_KEY = 'bhd_current_user_id';
const PWD_REQUESTS_KEY = 'bhd_pwd_requests_v1';
const NOTICES_KEY = 'bhd_notices_v1';
const BAN_APPEALS_KEY = 'bhd_ban_appeals_v1';

// Mock photos for seed users
const SEED_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=500&auto=format&fit=crop'
];

// Helper to generate sequential UID
const generateNextUid = (users: User[]): string => {
  let maxUid = 88000;
  users.forEach(u => {
    if (u.uid) {
      const val = parseInt(u.uid, 10);
      if (!isNaN(val) && val > maxUid) maxUid = val;
    }
  });
  return (maxUid + 1).toString();
};

// --- Database Core ---

export const initializeDatabase = () => {
  // 1. Check User Table Existence strictly
  const existingData = localStorage.getItem(USERS_KEY);
  
  if (existingData === null) {
    console.log("No database found. Initializing with seed data...");
    const seedUsers: User[] = [
      {
        id: 'seed-1',
        uid: '88001',
        username: 'Anna',
        displayName: 'Anna',
        password: '123',
        age: 23,
        contactType: 'wechat',
        contactValue: 'anna_love',
        registeredAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        likes: 128,
        bio: '喜欢摄影和旅游，寻找志同道合的朋友。',
        friends: [],
        friendRequests: [],
        photos: [SEED_PHOTOS[0], SEED_PHOTOS[1]]
      },
      {
        id: 'seed-2',
        uid: '88002',
        username: 'David',
        displayName: 'David Fitness',
        password: '123',
        age: 27,
        contactType: 'phone',
        contactValue: '13800000000',
        registeredAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        likes: 45,
        bio: '健身教练，每天都在努力变更好。',
        friends: [],
        friendRequests: [],
        photos: [SEED_PHOTOS[4]]
      },
      {
        id: 'seed-3',
        uid: '88003',
        username: 'Elena',
        displayName: 'Elena Art',
        password: '123',
        age: 21,
        contactType: 'wechat',
        contactValue: 'elena_x',
        registeredAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        likes: 256,
        bio: '艺术系学生，平时喜欢画画。',
        friends: [],
        friendRequests: [],
        photos: [SEED_PHOTOS[2], SEED_PHOTOS[3]]
      }
    ];
    try {
      localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
    } catch (e) {
      console.error("Failed to seed database:", e);
    }
  } else {
    // Data exists, perform migration for displayName and bans
    try {
        let users: User[] = JSON.parse(existingData);
        let needsSave = false;
        let currentMax = 88000;
        
        users.forEach(u => {
          if (u.uid) {
            const val = parseInt(u.uid);
            if (val > currentMax) currentMax = val;
          }
        });

        users = users.map(u => {
          let uMod = { ...u };
          // Migrate UID
          if (!uMod.uid) {
            currentMax++;
            needsSave = true;
            uMod.uid = currentMax.toString();
          }
          // Migrate DisplayName
          if (!uMod.displayName) {
            uMod.displayName = uMod.username;
            needsSave = true;
          }
          return uMod;
        });

        if (needsSave) {
          console.log("Migrating users data...");
          saveUsers(users); 
        }
    } catch (e) {
        console.error("Existing data corrupted", e);
    }
  }
  
  // Check Other Tables
  if (!localStorage.getItem(INVITES_KEY)) {
    const defaultCode: InvitationCode = {
      id: 'default-1',
      code: 'BLACKHORSE',
      isUsed: false,
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(INVITES_KEY, JSON.stringify([defaultCode]));
  }
  if (!localStorage.getItem(MESSAGES_KEY)) localStorage.setItem(MESSAGES_KEY, JSON.stringify([]));
  if (!localStorage.getItem(PWD_REQUESTS_KEY)) localStorage.setItem(PWD_REQUESTS_KEY, JSON.stringify([]));
  if (!localStorage.getItem(BAN_APPEALS_KEY)) localStorage.setItem(BAN_APPEALS_KEY, JSON.stringify([]));
  
  if (!localStorage.getItem(NOTICES_KEY)) {
    const defaultNotice: Notice = {
      id: 'notice-1',
      title: '欢迎来到黑马相亲',
      content: '这是一个高端、私密的交友平台。请遵守社区规范，文明交友。如有违规行为，账号将被永久封禁。',
      createdAt: new Date().toISOString(),
      isImportant: true
    };
    localStorage.setItem(NOTICES_KEY, JSON.stringify([defaultNotice]));
  }
};

export const exportDatabase = () => {
  const data = {
    users: JSON.parse(localStorage.getItem(USERS_KEY) || '[]'),
    invites: JSON.parse(localStorage.getItem(INVITES_KEY) || '[]'),
    messages: JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]'),
    notices: JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]'),
    banAppeals: JSON.parse(localStorage.getItem(BAN_APPEALS_KEY) || '[]'),
    timestamp: new Date().toISOString()
  };
  return JSON.stringify(data, null, 2);
};

export const importDatabase = (jsonString: string) => {
  try {
    const data = JSON.parse(jsonString);
    if (data.users) localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
    if (data.invites) localStorage.setItem(INVITES_KEY, JSON.stringify(data.invites));
    if (data.messages) localStorage.setItem(MESSAGES_KEY, JSON.stringify(data.messages));
    if (data.notices) localStorage.setItem(NOTICES_KEY, JSON.stringify(data.notices));
    if (data.banAppeals) localStorage.setItem(BAN_APPEALS_KEY, JSON.stringify(data.banAppeals));
    return true;
  } catch (e) {
    console.error("Import failed", e);
    return false;
  }
};

// --- Auth & User Management ---

export const getUsers = (): User[] => {
  try {
    const data = localStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    console.error("Database corruption detected in USERS_KEY");
    return [];
  }
};

const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e: any) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      alert("⚠️ 数据保存失败：存储空间已满！");
      throw new Error("Storage Quota Exceeded");
    } else {
      console.error("Save failed:", e);
      throw e;
    }
  }
};

export const updateUserHeartbeat = (userId: string) => {
  try {
      const users = getUsers();
      const index = users.findIndex(u => u.id === userId);
      if (index !== -1) {
        users[index].lastActiveAt = new Date().toISOString();
        saveUsers(users);
      }
  } catch (e) {
      console.error("Heartbeat failed", e); 
  }
};

export const loginUser = async (username: string, password: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const users = getUsers();
  const index = users.findIndex(u => u.username === username && u.password === password && !u.isDeleted);
  
  if (index === -1) throw new Error('账号或密码错误');

  const user = users[index];

  // --- Ban Logic Check ---
  if (user.isBanned) {
      const now = new Date();
      if (user.banExpiresAt && new Date(user.banExpiresAt) > now) {
          // Still banned
          // Format date for display
          const dateStr = new Date(user.banExpiresAt).toLocaleString('zh-CN');
          // Throw specific error to be caught by UI
          throw new Error(`ACCOUNT_BANNED|${dateStr}|${user.username}`);
      } else {
          // Ban expired, auto unban
          user.isBanned = false;
          user.banExpiresAt = undefined;
          saveUsers(users); // Save unbanned state
      }
  }
  
  // Update last active on login
  try {
    user.lastActiveAt = new Date().toISOString();
    saveUsers(users);
  } catch (e) {}
  
  localStorage.setItem(CURRENT_USER_KEY, user.id);
  return user;
};

export const getCurrentUser = (): User | null => {
  const id = localStorage.getItem(CURRENT_USER_KEY);
  if (!id) return null;
  const users = getUsers();
  if (users.length === 0 && localStorage.getItem(USERS_KEY)) return null;
  const user = users.find(u => u.id === id);
  if (!user) {
    if (users.length > 0) localStorage.removeItem(CURRENT_USER_KEY);
    return null;
  }
  // Check ban status on session restore too
  if (user.isBanned) {
      const now = new Date();
      if (user.banExpiresAt && new Date(user.banExpiresAt) > now) {
          logoutUser();
          return null;
      } else {
          // Auto unban if expired
          const newUsers = users.map(u => {
              if (u.id === user.id) {
                  return { ...u, isBanned: false, banExpiresAt: undefined };
              }
              return u;
          });
          saveUsers(newUsers);
          return { ...user, isBanned: false, banExpiresAt: undefined };
      }
  }

  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const registerUser = async (user: Omit<User, 'id' | 'uid' | 'registeredAt' | 'likes' | 'friends' | 'friendRequests' | 'photos' | 'lastActiveAt' | 'displayName'>, inviteCodeStr?: string): Promise<User> => {
  await new Promise(resolve => setTimeout(resolve, 800)); 

  const users = getUsers();
  if (users.some(u => u.username === user.username)) {
    throw new Error('用户名已存在');
  }

  if (inviteCodeStr) {
    const invites = getInvitationCodes();
    const invite = invites.find(i => i.code === inviteCodeStr && !i.isUsed);
    if (!invite) throw new Error('邀请码无效或已被使用');

    invite.isUsed = true;
    invite.usedBy = user.username;
    localStorage.setItem(INVITES_KEY, JSON.stringify(invites));
  }

  const nextUid = generateNextUid(users);

  const newUser: User = {
    ...user,
    displayName: user.username, // Default display name = username
    id: crypto.randomUUID(),
    uid: nextUid,
    registeredAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    likes: 0,
    friends: [],
    friendRequests: [],
    photos: [],
    bio: '这个人很懒，什么都没写。'
  };

  users.push(newUser);
  saveUsers(users);
  return newUser;
};

export const adminCreateUser = async (user: any): Promise<User> => {
  return registerUser(user);
};

export const deleteUser = (userId: string) => {
  const users = getUsers();
  const newUsers = users.filter(u => u.id !== userId);
  saveUsers(newUsers);
};

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index === -1) throw new Error('User not found');
  
  users[index] = { ...users[index], ...updates };
  saveUsers(users);
  return users[index];
};

export const adminResetPassword = (username: string, specificPassword?: string) => {
  const users = getUsers();
  const index = users.findIndex(u => u.username === username);
  if (index !== -1) {
    users[index].password = specificPassword || '888888'; 
    saveUsers(users);
    return true;
  }
  return false;
};

// --- Ban System ---

export const banUser = (userId: string, durationMinutes: number) => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        const expiresAt = new Date(Date.now() + durationMinutes * 60000).toISOString();
        users[index].isBanned = true;
        users[index].banExpiresAt = expiresAt;
        saveUsers(users);
        
        // Force logout if online
        const currentSession = localStorage.getItem(CURRENT_USER_KEY);
        if (currentSession === userId) {
            logoutUser();
        }
    }
};

export const unbanUser = (userId: string) => {
    const users = getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
        users[index].isBanned = false;
        users[index].banExpiresAt = undefined;
        saveUsers(users);
    }
};

// --- Ban Appeals ---

export const getBanAppeals = (): BanAppeal[] => {
    try {
        return JSON.parse(localStorage.getItem(BAN_APPEALS_KEY) || '[]');
    } catch { return []; }
};

export const submitBanAppeal = (username: string, contactInfo: string) => {
    const appeals = getBanAppeals();
    const users = getUsers();
    const user = users.find(u => u.username === username);
    
    // Check pending
    if (appeals.some(a => a.username === username && a.status === 'PENDING')) {
        throw new Error("您已提交过申诉，请耐心等待管理员联系");
    }

    const newAppeal: BanAppeal = {
        id: crypto.randomUUID(),
        username: username,
        userId: user ? user.id : 'unknown',
        contactInfo: contactInfo,
        status: 'PENDING',
        createdAt: new Date().toISOString()
    };
    appeals.unshift(newAppeal);
    localStorage.setItem(BAN_APPEALS_KEY, JSON.stringify(appeals));
};

export const resolveBanAppeal = (appealId: string) => {
    const appeals = getBanAppeals();
    const idx = appeals.findIndex(a => a.id === appealId);
    if (idx !== -1) {
        appeals[idx].status = 'RESOLVED';
        localStorage.setItem(BAN_APPEALS_KEY, JSON.stringify(appeals));
    }
};

export const deleteBanAppeal = (appealId: string) => {
    const appeals = getBanAppeals();
    const newAppeals = appeals.filter(a => a.id !== appealId);
    localStorage.setItem(BAN_APPEALS_KEY, JSON.stringify(newAppeals));
};


// --- Password Requests ---

export const getPasswordRequests = (): PasswordRequest[] => {
  try {
    return JSON.parse(localStorage.getItem(PWD_REQUESTS_KEY) || '[]');
  } catch {
    return [];
  }
};

export const createPasswordRequest = (request: Omit<PasswordRequest, 'id' | 'status' | 'createdAt'>) => {
  const requests = getPasswordRequests();
  
  const users = getUsers();
  if (!users.some(u => u.username === request.username)) {
    throw new Error("用户名不存在");
  }

  if (requests.some(r => r.username === request.username && r.status === 'PENDING')) {
     throw new Error("您已有一个待处理的申请，请等待管理员审核");
  }

  const newRequest: PasswordRequest = {
    ...request,
    id: crypto.randomUUID(),
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };
  
  requests.unshift(newRequest);
  localStorage.setItem(PWD_REQUESTS_KEY, JSON.stringify(requests));
  return newRequest;
};

export const resolvePasswordRequest = (requestId: string) => {
  const requests = getPasswordRequests();
  const index = requests.findIndex(r => r.id === requestId);
  if (index !== -1) {
    requests[index].status = 'RESOLVED';
    localStorage.setItem(PWD_REQUESTS_KEY, JSON.stringify(requests));
  }
};

export const deletePasswordRequest = (requestId: string) => {
  const requests = getPasswordRequests();
  const newRequests = requests.filter(r => r.id !== requestId);
  localStorage.setItem(PWD_REQUESTS_KEY, JSON.stringify(newRequests));
};

// --- Notices ---

export const getNotices = (): Notice[] => {
  try {
    return JSON.parse(localStorage.getItem(NOTICES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const createNotice = (title: string, content: string, isImportant: boolean = false) => {
  const notices = getNotices();
  const newNotice: Notice = {
    id: crypto.randomUUID(),
    title,
    content,
    isImportant,
    createdAt: new Date().toISOString()
  };
  notices.unshift(newNotice);
  localStorage.setItem(NOTICES_KEY, JSON.stringify(notices));
  return newNotice;
};

export const deleteNotice = (id: string) => {
  const notices = getNotices();
  const newNotices = notices.filter(n => n.id !== id);
  localStorage.setItem(NOTICES_KEY, JSON.stringify(newNotices));
};

// --- Social Features ---

export const likeUser = (targetUserId: string) => {
  try {
    const users = getUsers();
    const target = users.find(u => u.id === targetUserId);
    if (target) {
        target.likes = (target.likes || 0) + 1;
        saveUsers(users);
    }
  } catch (e) {
      console.error("Like failed", e);
  }
};

export const sendFriendRequest = (fromUserId: string, toUserId: string) => {
  const users = getUsers();
  const target = users.find(u => u.id === toUserId);
  const sender = users.find(u => u.id === fromUserId);
  
  if (!target || !sender) throw new Error('User not found');
  if (target.friends.includes(fromUserId)) throw new Error('已经是好友了');
  if (target.friendRequests.includes(fromUserId)) throw new Error('已发送过申请');

  target.friendRequests.push(fromUserId);
  saveUsers(users);
};

export const acceptFriendRequest = (currentUserId: string, requesterId: string) => {
  const users = getUsers();
  const currentUser = users.find(u => u.id === currentUserId);
  const requester = users.find(u => u.id === requesterId);

  if (!currentUser || !requester) throw new Error('User not found');

  // Remove request
  currentUser.friendRequests = currentUser.friendRequests.filter(id => id !== requesterId);
  
  // Add friend connection both ways
  if (!currentUser.friends.includes(requesterId)) currentUser.friends.push(requesterId);
  if (!requester.friends.includes(currentUserId)) requester.friends.push(currentUserId);

  saveUsers(users);
};

export const rejectFriendRequest = (currentUserId: string, requesterId: string) => {
  const users = getUsers();
  const currentUser = users.find(u => u.id === currentUserId);
  if (currentUser) {
    currentUser.friendRequests = currentUser.friendRequests.filter(id => id !== requesterId);
    saveUsers(users);
  }
};

// --- Chat ---

export const getMessages = (userId1: string, userId2: string): ChatMessage[] => {
  const allMessages: ChatMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
  return allMessages.filter(m => 
    (m.fromId === userId1 && m.toId === userId2) || 
    (m.fromId === userId2 && m.toId === userId1)
  ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

export const sendMessage = (fromId: string, toId: string, content: string) => {
  const allMessages: ChatMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
  const newMessage: ChatMessage = {
    id: crypto.randomUUID(),
    fromId,
    toId,
    content,
    timestamp: new Date().toISOString()
  };
  allMessages.push(newMessage);
  localStorage.setItem(MESSAGES_KEY, JSON.stringify(allMessages));
  return newMessage;
};

// --- Invitation Code ---

export const getInvitationCodes = (): InvitationCode[] => {
  try {
    return JSON.parse(localStorage.getItem(INVITES_KEY) || '[]');
  } catch {
    return [];
  }
};

export const generateInvitationCode = (): InvitationCode => {
  const codes = getInvitationCodes();
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  const newCode: InvitationCode = {
    id: crypto.randomUUID(),
    code: `BH-${randomStr}`,
    isUsed: false,
    createdAt: new Date().toISOString()
  };
  codes.unshift(newCode);
  localStorage.setItem(INVITES_KEY, JSON.stringify(codes));
  return newCode;
};

export const deleteInvitationCode = (id: string) => {
  const codes = getInvitationCodes();
  const newCodes = codes.filter(c => c.id !== id);
  localStorage.setItem(INVITES_KEY, JSON.stringify(newCodes));
};

export const validateInvitationCode = (codeStr: string): boolean => {
  const codes = getInvitationCodes();
  return codes.some(c => c.code === codeStr && !c.isUsed);
};

export const clearData = () => {
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(INVITES_KEY);
  localStorage.removeItem(MESSAGES_KEY);
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(PWD_REQUESTS_KEY);
  localStorage.removeItem(NOTICES_KEY);
  localStorage.removeItem(BAN_APPEALS_KEY);
  // Re-init immediately
  initializeDatabase();
};