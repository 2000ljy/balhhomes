import React, { useEffect, useState } from 'react';
import { ViewState, Notice } from '../types';
import { getNotices } from '../services/mockBackend';
import { ArrowLeft, Bell, Calendar, Pin, AlertCircle } from 'lucide-react';

interface NoticeBoardProps {
  onNavigate: (view: ViewState) => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ onNavigate }) => {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    setNotices(getNotices());
  }, []);

  return (
    <div className="w-[1000px] max-w-[95vw] bg-[#09090b]/90 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-sm shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 relative max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center sticky top-0 z-20 pb-8 border-b border-white/10 mb-8 shrink-0">
        <button 
          onClick={() => onNavigate(ViewState.LOGIN)}
          className="absolute left-0 top-1 text-gray-500 hover:text-white flex items-center gap-2 text-sm transition-colors tracking-wide px-4 py-2 hover:bg-white/5 rounded-sm"
        >
          <ArrowLeft size={16} /> 返回
        </button>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 brand-font flex items-center gap-4">
          <Bell className="text-gold-500" size={36} /> 公告栏
        </h1>
        <p className="text-xs md:text-sm text-gray-500 uppercase tracking-[0.6em] font-light">SYSTEM NOTICES & UPDATES</p>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {notices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            {notices.map((notice) => (
              <div 
                key={notice.id} 
                className={`relative border flex flex-col gap-4 p-8 rounded-sm transition-all duration-300 hover:shadow-2xl group
                  ${notice.isImportant 
                    ? 'md:col-span-2 bg-gradient-to-br from-[#1c1917] to-black border-gold-500/40 shadow-[0_0_30px_rgba(234,179,8,0.05)]' 
                    : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
              >
                {/* Background Decoration Icon */}
                <div className="absolute top-4 right-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                   {notice.isImportant ? <AlertCircle size={100} /> : <Bell size={80} />}
                </div>

                {/* Header Section of the Card */}
                <div className="flex justify-between items-start gap-4 z-10">
                  <div className="flex-1">
                     {notice.isImportant && (
                       <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm mb-3 tracking-wider uppercase">
                         <Pin size={10} fill="currentColor" /> Important
                       </span>
                     )}
                     <h3 className={`font-bold leading-tight brand-font ${notice.isImportant ? 'text-2xl md:text-3xl text-gold-500' : 'text-xl text-white'}`}>
                       {notice.title}
                     </h3>
                  </div>
                  <div className="flex flex-col items-end text-gray-500 pt-1">
                    <span className="text-2xl font-bold font-mono text-white/20 group-hover:text-white/40 transition-colors">
                        {new Date(notice.createdAt).getDate().toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider flex items-center gap-1">
                       {new Date(notice.createdAt).toLocaleString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
                
                {/* Divider */}
                <div className={`h-[1px] w-full ${notice.isImportant ? 'bg-gradient-to-r from-gold-500/50 to-transparent' : 'bg-white/10'}`}></div>

                {/* Content Section - Fully Visible */}
                <div className="z-10">
                  <p className={`whitespace-pre-wrap leading-relaxed ${notice.isImportant ? 'text-base md:text-lg text-gray-200' : 'text-sm text-gray-400'}`}>
                    {notice.content}
                  </p>
                </div>

                {/* Footer of the card */}
                {notice.isImportant && (
                  <div className="mt-2 pt-4 border-t border-white/5 flex items-center justify-end">
                      <span className="text-[10px] text-gold-600 tracking-widest uppercase font-bold">Black Horse Admin Team</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 py-20">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
               <Bell size={48} className="opacity-30" />
            </div>
            <p className="text-lg tracking-widest uppercase">暂无公告</p>
            <p className="text-xs mt-2 opacity-50">No notices posted yet</p>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-4 text-center border-t border-white/5 pt-6 shrink-0">
        <p className="text-[10px] text-gray-600 tracking-[0.2em]">BLACK HORSE DATING OFFICIAL</p>
      </div>
    </div>
  );
};