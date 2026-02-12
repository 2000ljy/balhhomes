import React, { useEffect, useState, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { getUsers, acceptFriendRequest, rejectFriendRequest, getMessages, sendMessage } from '../services/mockBackend';
import { MessageSquare, UserPlus, Send, X, Check, Bell } from 'lucide-react';

interface AppFriendsProps {
  currentUser: User;
  onUpdateUser: (user: User) => void;
}

const isUserOnline = (user: User) => {
    if (!user.lastActiveAt) return false;
    const diff = new Date().getTime() - new Date(user.lastActiveAt).getTime();
    return diff < 35000;
};

export const AppFriends: React.FC<AppFriendsProps> = ({ currentUser, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');
  const [friendsList, setFriendsList] = useState<User[]>([]);
  const [requestsList, setRequestsList] = useState<User[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const refreshData = async () => {
    const allUsers = await getUsers();
    const freshCurrentUser = allUsers.find(u => u.id === currentUser.id);

    if (freshCurrentUser) {
        if (freshCurrentUser.lastActiveAt !== currentUser.lastActiveAt || freshCurrentUser.friends.length !== currentUser.friends.length) {
            onUpdateUser(freshCurrentUser);
        }
        setFriendsList(allUsers.filter(u => freshCurrentUser.friends.includes(u.id)));
        setRequestsList(allUsers.filter(u => freshCurrentUser.friendRequests.includes(u.id)));
    }
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000); 
    return () => clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
    if (selectedFriendId) {
      const fetchMsgs = async () => {
        const msgs = await getMessages(currentUser.id, selectedFriendId);
        setMessages(msgs);
      };
      fetchMsgs();
      const interval = setInterval(fetchMsgs, 2000); 
      return () => clearInterval(interval);
    }
  }, [selectedFriendId, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAccept = async (reqId: string) => {
    try {
      await acceptFriendRequest(currentUser.id, reqId);
      setRequestsList(prev => prev.filter(r => r.id !== reqId));
      refreshData();
    } catch (e: any) { alert(e.message); }
  };

  const handleReject = async (reqId: string) => {
    try {
        await rejectFriendRequest(currentUser.id, reqId);
        setRequestsList(prev => prev.filter(r => r.id !== reqId));
        refreshData();
    } catch (e: any) { console.error(e); }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriendId || !newMessage.trim()) return;
    await sendMessage(currentUser.id, selectedFriendId, newMessage);
    setNewMessage('');
    const msgs = await getMessages(currentUser.id, selectedFriendId);
    setMessages(msgs);
  };

  const selectedFriend = friendsList.find(f => f.id === selectedFriendId);
  const isSelectedOnline = selectedFriend ? isUserOnline(selectedFriend) : false;

  return (
    <div className="h-full flex animate-in fade-in duration-500">
      <div className="w-80 border-r border-white/10 flex flex-col bg-black/20">
        <div className="flex border-b border-white/10">
          <button onClick={() => setActiveTab('friends')} className={`flex-1 py-4 text-xs font-bold tracking-wider transition-colors border-b-2 ${activeTab === 'friends' ? 'bg-white/5 text-white border-gold-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>好友列表 ({friendsList.length})</button>
          <button onClick={() => setActiveTab('requests')} className={`flex-1 py-4 text-xs font-bold tracking-wider transition-colors relative border-b-2 ${activeTab === 'requests' ? 'bg-white/5 text-white border-gold-500' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>新请求 {requestsList.length > 0 && <span className="absolute top-3 right-3 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>}</button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'friends' ? (
             friendsList.length > 0 ? (
               friendsList.map(friend => {
                 const isOnline = isUserOnline(friend);
                 const displayName = friend.displayName || friend.username;
                 return (
                 <div key={friend.id} onClick={() => setSelectedFriendId(friend.id)} className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 group ${selectedFriendId === friend.id ? 'bg-white/10 border-l-2 border-l-gold-500' : 'border-l-2 border-l-transparent'}`}>
                   <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs border border-white/10 overflow-hidden relative">
                     {friend.photos?.[0] ? <img src={friend.photos[0]} className="w-full h-full object-cover" /> : displayName.charAt(0).toUpperCase()}
                     {isOnline && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black"></div>}
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-white text-sm font-bold truncate group-hover:text-gold-500 transition-colors">{displayName}</p>
                     <p className={`text-[10px] truncate ${isOnline ? 'text-green-400' : 'text-gray-600'}`}>{isOnline ? '在线' : '离线'}</p>
                   </div>
                 </div>
               )})
             ) : <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2"><UserPlus size={24} className="opacity-20" /><span className="text-xs">暂无好友</span></div>
          ) : (
             requestsList.length > 0 ? (
               <div className="p-4 space-y-4">
               {requestsList.map(req => {
                 const displayName = req.displayName || req.username;
                 return (
                 <div key={req.id} className="p-4 bg-[#1a1a1c] border border-white/10 rounded-sm shadow-lg">
                   <div className="flex items-center gap-3 mb-4">
                     <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs border border-white/10 overflow-hidden">{req.photos?.[0] ? <img src={req.photos[0]} className="w-full h-full object-cover" /> : displayName.charAt(0)}</div>
                     <div><p className="text-white text-sm font-bold">{displayName}</p><p className="text-gray-500 text-[10px]">请求添加好友</p></div>
                   </div>
                   <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => handleAccept(req.id)} className="py-2.5 bg-gold-500 text-black text-xs font-bold rounded-sm flex items-center justify-center gap-1"><Check size={14} /> 接受</button>
                     <button onClick={() => handleReject(req.id)} className="py-2.5 bg-white/5 text-gray-400 text-xs rounded-sm flex items-center justify-center gap-1 border border-white/5"><X size={14} /> 拒绝</button>
                   </div>
                 </div>
               )})}
               </div>
             ) : <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2"><Bell size={24} className="opacity-20" /><span className="text-xs">暂无请求</span></div>
          ) }
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0c0c0e]">
        {selectedFriend ? (
          <>
            <div className="h-16 border-b border-white/10 flex items-center px-6 justify-between bg-white/5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white text-xs border border-white/20 overflow-hidden">
                   {selectedFriend.photos?.[0] ? <img src={selectedFriend.photos[0]} className="w-full h-full object-cover" /> : (selectedFriend.displayName||selectedFriend.username).charAt(0)}
                </div>
                <div>
                    <span className="text-white font-bold text-sm block">{selectedFriend.displayName || selectedFriend.username}</span>
                    <span className={`text-[10px] flex items-center gap-1 ${isSelectedOnline ? 'text-green-500' : 'text-gray-500'}`}>{isSelectedOnline ? '在线' : '离线'}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map(msg => {
                const isMe = msg.fromId === currentUser.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`max-w-[70%] p-4 rounded-lg text-sm leading-relaxed shadow-lg ${isMe ? 'bg-gold-500 text-black rounded-tr-none' : 'bg-[#1a1a1c] border border-white/10 text-white rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-black/20">
              <div className="flex gap-3">
                <div className="flex-1 relative">
                    <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="输入消息..." className="w-full bg-white/5 border border-white/10 rounded-sm pl-4 pr-10 py-3 text-white text-sm focus:outline-none focus:border-gold-500/50" />
                </div>
                <button type="submit" className="bg-gold-500 text-black px-6 rounded-sm hover:bg-gold-400"><Send size={18} /></button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
            <MessageSquare size={40} className="text-gray-500 opacity-50 mb-4" />
            <p className="text-sm font-medium text-gray-400">选择好友开始聊天</p>
          </div>
        )}
      </div>
    </div>
  );
};