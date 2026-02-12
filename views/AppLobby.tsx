import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { getUsers, sendFriendRequest, likeUser } from '../services/mockBackend';
import { Search, UserPlus, Heart, Check, X, ChevronLeft, ChevronRight, ShieldCheck, Fingerprint } from 'lucide-react';

interface AppLobbyProps {
  currentUser: User;
}

export const AppLobby: React.FC<AppLobbyProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [requestSent, setRequestSent] = useState<Record<string, boolean>>({});
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [localLikes, setLocalLikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const load = async () => {
        const all = await getUsers();
        setUsers(all.filter(u => u.id !== currentUser.id && !u.isDeleted && !u.isBanned));
    };
    load();
    const interval = setInterval(load, 10000); // Sync every 10s
    return () => clearInterval(interval);
  }, [currentUser.id]);

  useEffect(() => {
    if (selectedUser) {
      setCurrentPhotoIndex(0);
      setLocalLikes(selectedUser.likes || 0);
      setHasLiked(false);
    }
  }, [selectedUser]);

  const handleSendRequest = async (e: React.MouseEvent, targetId: string) => {
    e.stopPropagation();
    try {
      await sendFriendRequest(currentUser.id, targetId);
      setRequestSent(prev => ({ ...prev, [targetId]: true }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleLike = async () => {
    if (!selectedUser || hasLiked) return;
    await likeUser(selectedUser.id);
    setLocalLikes(prev => prev + 1);
    setHasLiked(true);
    // Optimistic update
    setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, likes: (u.likes || 0) + 1 } : u));
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedUser?.photos?.length) setCurrentPhotoIndex(prev => (prev + 1) % selectedUser.photos.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedUser?.photos?.length) setCurrentPhotoIndex(prev => (prev - 1 + selectedUser.photos.length) % selectedUser.photos.length);
  };

  const filteredUsers = users.filter(u => 
    (u.displayName && u.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.uid && u.uid.includes(searchTerm)) ||
    (u.bio && u.bio.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full flex flex-col p-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">交友大厅</h2>
          <p className="text-gray-500 text-xs">发现优秀的TA</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <input 
            type="text" 
            placeholder="搜索UID、昵称..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-sm pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-gold-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 content-start pb-8">
        {filteredUsers.map(user => {
          const isFriend = currentUser.friends.includes(user.id);
          const hasRequested = currentUser.friendRequests.includes(user.id) || user.friendRequests.includes(currentUser.id) || requestSent[user.id];
          const bgImage = user.photos?.[0];
          const displayName = user.displayName || user.username;

          return (
            <div key={user.id} onClick={() => setSelectedUser(user)} className="relative aspect-[3/4] bg-[#0c0c0e] border border-white/10 rounded-sm overflow-hidden group cursor-pointer hover:border-white/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl">
               {bgImage ? (
                 <div className="absolute inset-0">
                    <img src={bgImage} alt={displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                 </div>
               ) : (
                 <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-black flex items-center justify-center">
                    <span className="text-6xl text-white/10 font-bold brand-font">{displayName.charAt(0).toUpperCase()}</span>
                 </div>
               )}
               <div className="absolute bottom-0 left-0 w-full p-5 flex flex-col items-start z-10">
                 <div className="flex justify-between w-full items-end mb-3">
                   <div>
                     <h3 className="text-white font-bold text-xl leading-none mb-1 tracking-wide">{displayName}</h3>
                     <p className="text-gray-400 text-xs font-medium">{user.age}岁 · UID:{user.uid || 'N/A'}</p>
                   </div>
                   <div className="flex items-center gap-1.5 text-[10px] text-white/90 bg-white/10 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                      <Heart size={10} className="fill-current text-white" /> {user.likes || 0}
                    </div>
                 </div>
                 <div className="w-full">
                    {isFriend ? (
                       <button disabled className="w-full py-2.5 bg-green-500/90 backdrop-blur-sm text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1"><Check size={12} /> 已是好友</button>
                    ) : hasRequested ? (
                       <button disabled className="w-full py-2.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-sm flex items-center justify-center gap-1"><Check size={12} /> 已发送申请</button>
                    ) : (
                       <button onClick={(e) => handleSendRequest(e, user.id)} className="w-full py-2.5 bg-white text-black text-xs font-bold rounded-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors tracking-wide"><UserPlus size={12} /> 添加好友</button>
                    )}
                 </div>
               </div>
            </div>
          );
        })}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={() => setSelectedUser(null)}></div>
          <div className="w-full max-w-5xl h-[85vh] bg-[#0c0c0e] border border-white/10 rounded-lg shadow-2xl flex overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedUser(null)} className="absolute top-5 right-5 z-30 w-10 h-10 bg-black/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white hover:text-black transition-all border border-white/10"><X size={18} /></button>
            <div className="w-full md:w-[60%] h-full bg-black relative group select-none">
               {selectedUser.photos?.length ? (
                 <>
                    <img key={currentPhotoIndex} src={selectedUser.photos[currentPhotoIndex]} alt="Gallery" className="w-full h-full object-cover animate-in fade-in duration-500" />
                    {selectedUser.photos.length > 1 && (
                      <>
                        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-start pl-4 cursor-pointer" onClick={prevPhoto}><ChevronLeft className="text-white" size={32}/></div>
                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end pr-4 cursor-pointer" onClick={nextPhoto}><ChevronRight className="text-white" size={32}/></div>
                      </>
                    )}
                 </>
               ) : <div className="w-full h-full flex items-center justify-center bg-[#111] text-white/5 text-9xl font-bold">{(selectedUser.displayName||selectedUser.username).charAt(0)}</div>}
            </div>
            <div className="w-full md:w-[40%] h-full flex flex-col bg-[#0c0c0e] border-l border-white/5">
               <div className="flex-1 p-10 overflow-y-auto custom-scrollbar">
                  <div className="mb-8">
                     <h2 className="text-4xl font-bold text-white brand-font tracking-tight">{selectedUser.displayName || selectedUser.username}</h2>
                     <p className="text-gold-500 font-mono text-xs mt-2">UID: {selectedUser.uid}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-10">
                     <div className="p-4 rounded-lg bg-white/5 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-white">{localLikes}</span><span className="text-[10px] text-gray-500 uppercase">Likes</span></div>
                     <div className="p-4 rounded-lg bg-white/5 flex flex-col items-center justify-center"><span className="text-2xl font-bold text-white">{selectedUser.friends?.length||0}</span><span className="text-[10px] text-gray-500 uppercase">Friends</span></div>
                  </div>
                  <div className="mb-8"><h3 className="text-xs font-bold text-white uppercase tracking-[0.2em] mb-4 opacity-50">About Me</h3><p className="text-gray-300 text-sm leading-7 font-light">{selectedUser.bio || '...'}</p></div>
                  {currentUser.friends.includes(selectedUser.id) && <div className="mt-4 p-5 bg-white/5 rounded-lg"><p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Contact</p><p className="text-xl text-white font-mono">{selectedUser.contactValue}</p></div>}
               </div>
               <div className="p-8 border-t border-white/10 bg-[#0c0c0e]">
                  {currentUser.friends.includes(selectedUser.id) ? (
                    <div className="w-full py-4 bg-green-500/10 text-green-400 text-sm font-medium border border-green-500/20 rounded-lg flex items-center justify-center gap-2"><Check size={16} /> Friends</div>
                  ) : (
                     <div className="flex gap-4">
                       <button onClick={(e) => handleSendRequest(e, selectedUser.id)} disabled={currentUser.friendRequests.includes(selectedUser.id)} className="flex-1 py-4 bg-white text-black font-bold text-sm rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">{currentUser.friendRequests.includes(selectedUser.id) ? 'Request Sent' : 'Add Friend'}</button>
                       <button onClick={handleLike} className={`w-16 h-14 rounded-lg border flex items-center justify-center transition-all ${hasLiked ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 text-white'}`}><Heart size={22} className={hasLiked ? 'fill-current' : ''} /></button>
                     </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};