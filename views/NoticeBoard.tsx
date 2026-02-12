import React, { useEffect, useState } from 'react';
import { ViewState, Notice } from '../types';
import { getNotices } from '../services/mockBackend';
import { ArrowLeft, Bell, Pin, AlertCircle } from 'lucide-react';

interface NoticeBoardProps {
  onNavigate: (view: ViewState) => void;
}

export const NoticeBoard: React.FC<NoticeBoardProps> = ({ onNavigate }) => {
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const load = async () => {
        setNotices(await getNotices());
    };
    load();
  }, []);

  return (
    <div className="w-[1000px] max-w-[95vw] bg-[#09090b]/90 backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-sm shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-500 relative max-h-[90vh] flex flex-col">
      <div className="flex flex-col items-center sticky top-0 z-20 pb-8 border-b border-white/10 mb-8 shrink-0">
        <button onClick={() => onNavigate(ViewState.LOGIN)} className="absolute left-0 top-1 text-gray-500 hover:text-white flex items-center gap-2 text-sm transition-colors tracking-wide px-4 py-2 hover:bg-white/5 rounded-sm"><ArrowLeft size={16} /> 返回</button>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 brand-font flex items-center gap-4"><Bell className="text-gold-500" size={36} /> 公告栏</h1>
        <p className="text-xs md:text-sm text-gray-500 uppercase tracking-[0.6em] font-light">SYSTEM NOTICES & UPDATES</p>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        {notices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-8">
            {notices.map((notice) => (
              <div key={notice.id} className={`relative border flex flex-col gap-4 p-8 rounded-sm transition-all duration-300 hover:shadow-2xl group ${notice.isImportant ? 'md:col-span-2 bg-gradient-to-br from-[#1c1917] to-black border-gold-500/40 shadow-[0_0_30px_rgba(234,179,8,0.05)]' : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'}`}>
                <div className="absolute top-4 right-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">{notice.isImportant ? <AlertCircle size={100} /> : <Bell size={80} />}</div>
                <div className="flex justify-between items-start gap-4 z-10">
                  <div className="flex-1">
                     {notice.isImportant && <span className="inline-flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm mb-3 tracking-wider uppercase"><Pin size={10} fill="currentColor" /> Important</span>}
                     <h3 className={`font-bold mb-2 ${notice.isImportant ? 'text-2xl text-white' : 'text-lg text-gray-200'}`}>{notice.title}</h3>
                     <p className={`text-sm leading-relaxed whitespace-pre-line ${notice.isImportant ? 'text-gray-300' : 'text-gray-400'}`}>{notice.content}</p>
                  </div>
                </div>
                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center"><span className="text-[10px] text-gray-600 font-mono">{new Date(notice.createdAt).toLocaleString()}</span><div className={`w-2 h-2 rounded-full ${notice.isImportant ? 'bg-gold-500 animate-pulse' : 'bg-gray-700'}`}></div></div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-20 text-gray-500">暂无公告</div>}
      </div>
    </div>
  );
};