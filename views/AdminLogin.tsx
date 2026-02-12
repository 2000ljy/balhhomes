import React, { useState } from 'react';
import { ViewState } from '../types';
import { Input } from '../components/Input';
import { ChevronRight, ShieldCheck, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (view: ViewState) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (credentials.username === '072324' && credentials.password === '072324') {
      onNavigate(ViewState.ADMIN_DASHBOARD);
    } else {
      setError('认证失败');
    }
  };

  return (
    <div className="w-[500px] bg-[#09090b]/80 backdrop-blur-xl border border-white/10 p-12 rounded-sm shadow-[0_0_60px_-15px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center">
        <button 
          onClick={() => onNavigate(ViewState.LOGIN)}
          className="self-start mb-10 text-gray-500 hover:text-white flex items-center gap-2 text-xs transition-colors tracking-wide"
        >
          <ArrowLeft size={14} /> 返回首页
        </button>

        <div className="mb-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
            <ShieldCheck className="text-gray-300" size={28} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 brand-font">管理员登录</h2>
          <p className="text-xs text-gray-500 uppercase tracking-[0.3em]">ADMINISTRATOR ACCESS</p>
        </div>

        <div className="w-full">
          {error && (
            <div className="mb-8 p-3 bg-red-900/20 border-l-2 border-red-500 text-red-200 text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Input 
              label="管理员账号"
              labelEn="ADMIN ID"
              placeholder="输入账号"
              value={credentials.username}
              onChange={e => setCredentials({...credentials, username: e.target.value})}
            />
            
            <Input 
              label="密码"
              labelEn="PASSWORD"
              type="password"
              placeholder="输入密码"
              value={credentials.password}
              onChange={e => setCredentials({...credentials, password: e.target.value})}
            />

            <button
              type="submit"
              className="w-full mt-10 border border-white/20 hover:bg-white/10 hover:border-white/40 text-white font-medium text-sm py-4 px-6 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 group tracking-[0.2em]"
            >
              登录后台 <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform text-gray-400" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};