import React, { useEffect, useState } from 'react';
import { User } from '../types';
import { getUsers, likeUser } from '../services/mockBackend';
import { Heart, Crown, ThumbsUp } from 'lucide-react';

interface AppLeaderboardProps {
  currentUser: User;
}

export const AppLeaderboard: React.FC<AppLeaderboardProps> = ({ currentUser }) => {
  const [rankedUsers, setRankedUsers] = useState<User[]>([]);

  const refreshList = async () => {
    const users = await getUsers();
    const active = users.filter(u => !u.isDeleted && !u.isBanned);
    active.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    setRankedUsers(active);
  };

  useEffect(() => {
    refreshList();
    const interval = setInterval(refreshList, 5000); // Live updates
    return () => clearInterval(interval);
  }, []);

  const handleLike = async (targetId: string) => {
    if (targetId === currentUser.id) return;
    await likeUser(targetId);
    refreshList();
  };

  return (
    <div className="h-full flex flex-col p-8">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2 brand-font flex items-center justify-center gap-3">
          <Crown className="text-gold-500" /> 人气排行榜 <Crown className="text-gold-500" />
        </h2>
        <p className="text-gray-500 text-xs tracking-[0.3em] uppercase">POPULARITY RANKING</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-20 lg:px-40">
        <div className="space-y-4 pb-8">
          {rankedUsers.map((user, index) => {
            let rankColor = 'text-gray-500';
            let bgColor = 'bg-[#0c0c0e]';
            let borderColor = 'border-white/5';
            
            if (index === 0) {
              rankColor = 'text-gold-500';
              bgColor = 'bg-gradient-to-r from-gold-500/10 to-transparent';
              borderColor = 'border-gold-500/30';
            } else if (index === 1) {
              rankColor = 'text-gray-300';
              bgColor = 'bg-gradient-to-r from-gray-400/10 to-transparent';
              borderColor = 'border-gray-400/30';
            } else if (index === 2) {
              rankColor = 'text-orange-700';
              bgColor = 'bg-gradient-to-r from-orange-700/10 to-transparent';
              borderColor = 'border-orange-700/30';
            }
            
            const displayName = user.displayName || user.username;

            return (
              <div key={user.id} className={`${bgColor} border ${borderColor} p-4 rounded-sm flex items-center gap-6 transition-all hover:bg-white/5`}>
                <div className={`text-2xl font-bold font-mono w-12 text-center ${rankColor}`}>
                  #{index + 1}
                </div>
                
                <div className="w-12 h-12 bg-black border border-white/10 rounded-full flex items-center justify-center text-white font-bold">
                   {displayName.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  <h3 className="text-white font-bold">{displayName}</h3>
                  <p className="text-gray-500 text-xs line-clamp-1">{user.bio || '...'}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase">AGE</p>
                    <p className="text-white font-mono">{user.age}</p>
                  </div>
                  <div className="text-center min-w-[60px]">
                    <p className="text-[10px] text-gray-500 uppercase">LIKES</p>
                    <p className="text-gold-500 font-mono font-bold flex items-center justify-center gap-1">
                      <Heart size={12} className="fill-current" /> {user.likes || 0}
                    </p>
                  </div>
                  
                  {user.id !== currentUser.id && (
                    <button 
                      onClick={() => handleLike(user.id)}
                      className="w-10 h-10 rounded-full bg-white/5 hover:bg-gold-500 hover:text-black text-gray-400 border border-white/10 flex items-center justify-center transition-all"
                      title="点赞"
                    >
                      <ThumbsUp size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};