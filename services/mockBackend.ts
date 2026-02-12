import { User, InvitationCode, ChatMessage, PasswordRequest, Notice, BanAppeal } from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, setDoc, doc, query, where, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { FIREBASE_CONFIG, isConfigured } from '../firebaseConfig';

// --- CONSTANTS ---
const USERS_KEY = 'bhd_real_users_v1';
const INVITES_KEY = 'bhd_real_invites_v1';
const MESSAGES_KEY = 'bhd_real_messages_v1';
const CURRENT_USER_KEY = 'bhd_current_user_id';
const PWD_REQUESTS_KEY = 'bhd_pwd_requests_v1';
const NOTICES_KEY = 'bhd_notices_v1';
const BAN_APPEALS_KEY = 'bhd_ban_appeals_v1';

// --- STATE ---
let db: any = null;
let isCloudMode = false;

// Mock photos for seed users
const SEED_PHOTOS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=500&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=500&auto=format&fit=crop'
];

// --- INITIALIZATION ---

export const initializeDatabase = async () => {
    // AUTOMATIC CLOUD CONNECTION
    if (isConfigured()) {
        try {
            const app = !getApps().length ? initializeApp(FIREBASE_CONFIG) : getApp();
            db = getFirestore(app);
            isCloudMode = true;
            console.log("🔥 Cloud Mode Activated: Auto-connected via config file.");
            return true;
        } catch (e) {
            console.error("Firebase Connection Error:", e);
            alert("数据库连接失败，请检查 firebaseConfig.ts 中的配置是否正确。");
            isCloudMode = false;
        }
    } else {
        console.warn("⚠️ Firebase 未配置。请在 firebaseConfig.ts 中填入您的密钥以启用全网同步。目前运行在单机模式。");
    }

    // Fallback to Local Storage if config is missing or fails
    isCloudMode = false;
    
    // Local Storage Init Logic (Seed Data)
    if (!localStorage.getItem(USERS_KEY)) {
         const seedUsers: User[] = [
            { id: 'seed-1', uid: '88001', username: 'Anna', displayName: 'Anna', password: '123', age: 23, contactType: 'wechat', contactValue: 'anna_love', registeredAt: new Date().toISOString(), likes: 128, bio: '喜欢摄影和旅游。', friends: [], friendRequests: [], photos: [SEED_PHOTOS[0]] } as any,
         ];
         localStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
    }
    if (!localStorage.getItem(INVITES_KEY)) {
         localStorage.setItem(INVITES_KEY, JSON.stringify([{ id: 'default-1', code: 'BLACKHORSE', isUsed: false, createdAt: new Date().toISOString() }]));
    }
    [MESSAGES_KEY, PWD_REQUESTS_KEY, NOTICES_KEY, BAN_APPEALS_KEY].forEach(key => {
        if(!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
    });
    return false;
};

export const isCloudEnabled = () => isCloudMode;

// --- CORE CRUD (Hybrid) ---

const fetchCollection = async <T>(collectionName: string, localKey: string): Promise<T[]> => {
    if (isCloudMode && db) {
        try {
            const snap = await getDocs(collection(db, collectionName));
            return snap.docs.map(d => d.data() as T);
        } catch (e) {
            console.error(`Error fetching ${collectionName}`, e);
            return [];
        }
    } else {
        return JSON.parse(localStorage.getItem(localKey) || '[]');
    }
};

const saveItem = async (collectionName: string, localKey: string, item: any, idField = 'id') => {
    if (isCloudMode && db) {
        await setDoc(doc(db, collectionName, item[idField]), item);
    } else {
        const list = JSON.parse(localStorage.getItem(localKey) || '[]');
        const idx = list.findIndex((x: any) => x[idField] === item[idField]);
        if (idx >= 0) list[idx] = item; else list.push(item);
        localStorage.setItem(localKey, JSON.stringify(list));
    }
};

const deleteItem = async (collectionName: string, localKey: string, id: string) => {
    if (isCloudMode && db) {
        await deleteDoc(doc(db, collectionName, id));
    } else {
        let list = JSON.parse(localStorage.getItem(localKey) || '[]');
        list = list.filter((x: any) => x.id !== id);
        localStorage.setItem(localKey, JSON.stringify(list));
    }
};

// --- DATA ACCESSORS (ASYNC) ---

export const getUsers = async (): Promise<User[]> => {
    return fetchCollection<User>('users', USERS_KEY);
};

export const getInvitationCodes = async (): Promise<InvitationCode[]> => {
    return fetchCollection<InvitationCode>('invites', INVITES_KEY);
};

export const getNotices = async (): Promise<Notice[]> => {
    return fetchCollection<Notice>('notices', NOTICES_KEY);
};

export const getPasswordRequests = async (): Promise<PasswordRequest[]> => {
    return fetchCollection<PasswordRequest>('pwdRequests', PWD_REQUESTS_KEY);
};

export const getBanAppeals = async (): Promise<BanAppeal[]> => {
    return fetchCollection<BanAppeal>('banAppeals', BAN_APPEALS_KEY);
};

export const getMessages = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
    if (isCloudMode && db) {
        const q = query(collection(db, 'messages')); 
        const snap = await getDocs(q);
        const allMsgs = snap.docs.map(d => d.data() as ChatMessage);
        return allMsgs.filter(m => 
            (m.fromId === userId1 && m.toId === userId2) || 
            (m.fromId === userId2 && m.toId === userId1)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } else {
        const allMessages: ChatMessage[] = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]');
        return allMessages.filter(m => 
            (m.fromId === userId1 && m.toId === userId2) || 
            (m.fromId === userId2 && m.toId === userId1)
        ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }
};

// --- OPERATIONS ---

export const loginUser = async (username: string, password: string): Promise<User> => {
    await new Promise(r => setTimeout(r, 800)); // Fake network delay
    
    let user: User | undefined;
    
    if (isCloudMode && db) {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const u = snap.docs[0].data() as User;
            if (u.password === password && !u.isDeleted) user = u;
        }
    } else {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        user = users.find((u: User) => u.username === username && u.password === password && !u.isDeleted);
    }

    if (!user) throw new Error('账号或密码错误');

    if (user.isBanned) {
        const now = new Date();
        if (user.banExpiresAt && new Date(user.banExpiresAt) > now) {
            const dateStr = new Date(user.banExpiresAt).toLocaleString('zh-CN');
            throw new Error(`ACCOUNT_BANNED|${dateStr}|${user.username}`);
        } else {
            user.isBanned = false;
            user.banExpiresAt = undefined;
            await updateUserProfile(user.id, { isBanned: false, banExpiresAt: undefined });
        }
    }

    await updateUserProfile(user.id, { lastActiveAt: new Date().toISOString() });
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return user;
};

export const registerUser = async (user: Omit<User, 'id' | 'uid' | 'registeredAt' | 'likes' | 'friends' | 'friendRequests' | 'photos' | 'lastActiveAt' | 'displayName'>, inviteCodeStr?: string): Promise<User> => {
    const allUsers = await getUsers();
    if (allUsers.some(u => u.username === user.username)) throw new Error('用户名已存在');

    if (inviteCodeStr) {
        const allInvites = await getInvitationCodes();
        const invite = allInvites.find(i => i.code === inviteCodeStr && !i.isUsed);
        if (!invite) throw new Error('邀请码无效或已被使用');
        
        invite.isUsed = true;
        invite.usedBy = user.username;
        await saveItem('invites', INVITES_KEY, invite);
    }

    const maxUid = allUsers.reduce((max, u) => Math.max(max, parseInt(u.uid || '0') || 88000), 88000);
    const nextUid = (maxUid + 1).toString();
    
    const newUser: User = {
        ...user,
        id: crypto.randomUUID(),
        uid: nextUid,
        displayName: user.username,
        registeredAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        likes: 0,
        friends: [],
        friendRequests: [],
        photos: [],
        bio: '这个人很懒，什么都没写。'
    };

    await saveItem('users', USERS_KEY, newUser);
    return newUser;
};

export const adminCreateUser = async (user: any) => registerUser(user);

export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    if (isCloudMode && db) {
        const ref = doc(db, 'users', userId);
        await updateDoc(ref, updates);
        const snap = await getDocs(query(collection(db, 'users'), where('id', '==', userId)));
        return snap.docs[0].data() as User;
    } else {
        const users = await getUsers();
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) throw new Error("User not found");
        users[idx] = { ...users[idx], ...updates };
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return users[idx];
    }
};

export const getCurrentUser = async (): Promise<User | null> => {
    const id = localStorage.getItem(CURRENT_USER_KEY);
    if (!id) return null;

    if (isCloudMode && db) {
        const q = query(collection(db, 'users'), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
             const user = snap.docs[0].data() as User;
             if (user.isBanned) {
                const now = new Date();
                if (user.banExpiresAt && new Date(user.banExpiresAt) > now) {
                     logoutUser(); return null;
                }
             }
             return user;
        }
        return null;
    } else {
        const users = await getUsers();
        const user = users.find(u => u.id === id);
        if(!user) return null;
        if (user.isBanned) {
             const now = new Date();
             if (user.banExpiresAt && new Date(user.banExpiresAt) > now) {
                 logoutUser(); return null;
             }
        }
        return user;
    }
};

export const logoutUser = () => localStorage.removeItem(CURRENT_USER_KEY);

export const updateUserHeartbeat = async (userId: string) => {
    try {
        await updateUserProfile(userId, { lastActiveAt: new Date().toISOString() });
    } catch {}
};

// --- Feature Helpers ---

export const generateInvitationCode = async () => {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newCode: InvitationCode = {
        id: crypto.randomUUID(),
        code: `BH-${randomStr}`,
        isUsed: false,
        createdAt: new Date().toISOString()
    };
    await saveItem('invites', INVITES_KEY, newCode);
    return newCode;
};

export const deleteInvitationCode = async (id: string) => deleteItem('invites', INVITES_KEY, id);

export const validateInvitationCode = async (codeStr: string) => {
    const invites = await getInvitationCodes();
    return invites.some(i => i.code === codeStr && !i.isUsed);
};

export const createNotice = async (title: string, content: string, isImportant: boolean) => {
    const newNotice: Notice = {
        id: crypto.randomUUID(),
        title, content, isImportant, createdAt: new Date().toISOString()
    };
    await saveItem('notices', NOTICES_KEY, newNotice);
};

export const deleteNotice = async (id: string) => deleteItem('notices', NOTICES_KEY, id);

export const sendMessage = async (fromId: string, toId: string, content: string) => {
    const msg: ChatMessage = {
        id: crypto.randomUUID(), fromId, toId, content, timestamp: new Date().toISOString()
    };
    await saveItem('messages', MESSAGES_KEY, msg);
};

export const likeUser = async (targetUserId: string) => {
    const users = await getUsers();
    const target = users.find(u => u.id === targetUserId);
    if(target) {
        await updateUserProfile(target.id, { likes: (target.likes || 0) + 1 });
    }
};

export const sendFriendRequest = async (fromId: string, toId: string) => {
    const users = await getUsers();
    const target = users.find(u => u.id === toId);
    if (!target) throw new Error("User not found");
    if (target.friendRequests.includes(fromId)) return;
    if (target.friends.includes(fromId)) throw new Error("Already friends");
    
    const newRequests = [...target.friendRequests, fromId];
    await updateUserProfile(toId, { friendRequests: newRequests });
};

export const acceptFriendRequest = async (currentUserId: string, requesterId: string) => {
    const users = await getUsers();
    const me = users.find(u => u.id === currentUserId);
    const them = users.find(u => u.id === requesterId);
    
    if(!me || !them) return;

    const newMeReq = me.friendRequests.filter(id => id !== requesterId);
    const newMeFriends = [...me.friends, requesterId];
    const newThemFriends = [...them.friends, currentUserId];

    await updateUserProfile(me.id, { friendRequests: newMeReq, friends: newMeFriends });
    await updateUserProfile(them.id, { friends: newThemFriends });
};

export const rejectFriendRequest = async (currentUserId: string, requesterId: string) => {
    const users = await getUsers();
    const me = users.find(u => u.id === currentUserId);
    if(me) {
        const newReq = me.friendRequests.filter(id => id !== requesterId);
        await updateUserProfile(me.id, { friendRequests: newReq });
    }
};

// --- Admin & Security ---

export const createPasswordRequest = async (req: Omit<PasswordRequest, 'id'|'status'|'createdAt'>) => {
    const newReq: PasswordRequest = {
        ...req, id: crypto.randomUUID(), status: 'PENDING', createdAt: new Date().toISOString()
    };
    await saveItem('pwdRequests', PWD_REQUESTS_KEY, newReq);
};

export const resolvePasswordRequest = async (id: string) => {
    const reqs = await getPasswordRequests();
    const req = reqs.find(r => r.id === id);
    if(req) {
        req.status = 'RESOLVED';
        await saveItem('pwdRequests', PWD_REQUESTS_KEY, req);
    }
};

export const deletePasswordRequest = async (id: string) => deleteItem('pwdRequests', PWD_REQUESTS_KEY, id);

export const submitBanAppeal = async (username: string, contact: string) => {
    const users = await getUsers();
    const user = users.find(u => u.username === username);
    const appeal: BanAppeal = {
        id: crypto.randomUUID(), username, userId: user?.id || 'unknown', contactInfo: contact, status: 'PENDING', createdAt: new Date().toISOString()
    };
    await saveItem('banAppeals', BAN_APPEALS_KEY, appeal);
};

export const resolveBanAppeal = async (id: string) => {
    const list = await getBanAppeals();
    const item = list.find(x => x.id === id);
    if(item) {
        item.status = 'RESOLVED';
        await saveItem('banAppeals', BAN_APPEALS_KEY, item);
    }
};

export const deleteBanAppeal = async (id: string) => deleteItem('banAppeals', BAN_APPEALS_KEY, id);

export const banUser = async (id: string, mins: number) => {
    const expires = new Date(Date.now() + mins * 60000).toISOString();
    await updateUserProfile(id, { isBanned: true, banExpiresAt: expires });
};

export const unbanUser = async (id: string) => {
    await updateUserProfile(id, { isBanned: false, banExpiresAt: undefined });
};

export const deleteUser = async (id: string) => deleteItem('users', USERS_KEY, id);

export const adminResetPassword = async (username: string, pwd?: string) => {
    const users = await getUsers();
    const u = users.find(x => x.username === username);
    if(u) {
        await updateUserProfile(u.id, { password: pwd || '888888' });
        return true;
    }
    return false;
};

export const exportDatabase = async () => {
    const users = await getUsers();
    const invites = await getInvitationCodes();
    const notices = await getNotices();
    return JSON.stringify({ users, invites, notices, timestamp: new Date().toISOString() });
};

export const importDatabase = async (json: string) => {
    if (isCloudMode) {
        alert("云端模式下请勿直接导入本地备份");
        return false;
    }
    try {
        const data = JSON.parse(json);
        if(data.users) localStorage.setItem(USERS_KEY, JSON.stringify(data.users));
        if(data.invites) localStorage.setItem(INVITES_KEY, JSON.stringify(data.invites));
        if(data.notices) localStorage.setItem(NOTICES_KEY, JSON.stringify(data.notices));
        return true;
    } catch { return false; }
};

export const clearData = async () => {
    if(isCloudMode) return alert("不能从客户端清空云端数据库");
    localStorage.clear();
    window.location.reload();
};