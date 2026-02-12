import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { loginUser, createPasswordRequest, submitBanAppeal, isCloudEnabled } from '../services/mockBackend';
import { Input } from '../components/Input';
import { ChevronRight, Loader2, X, Lock, CheckCircle, Bell, Ban, Cloud, Database, ServerCrash, ArrowRight } from 'lucide-react';
import { isConfigured } from '../firebaseConfig';

interface UserLoginProps {
  onNavigate: (view: ViewState) => void;
  onLoginSuccess: () => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 状态检查
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    // 检查是否已在 firebaseConfig.ts 中填入配置
    setIsReady(isConfigured());
  }, []);

  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [pwdTab, setPwdTab] = useState<'RESET' | 'RETRIEVE'>('RESET');
  const [pwdRequestData, setPwdRequestData] = useState({ username: '', newPassword: '', contact: '', wechat: '', phone: '', email: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');
  
  const [banInfo, setBanInfo] = useState<{username: string, date: string} | null>(null);
  const [appealContact, setAppealContact] = useState('');
  const [appealSuccess, setAppealSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginUser(formData.username.trim(), formData.password);
      onLoginSuccess();
    } catch (err: any) {
      const msg = err.message;
      if (msg.startsWith('ACCOUNT_BANNED|')) {
          const parts = msg.split('|');
          setBanInfo({ date: parts[1], username: parts[2] });
      } else {
          setError(msg || '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppealSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!appealContact || !banInfo) return;
      try {
          await submitBanAppeal(banInfo.username, appealContact);
          setAppealSuccess("申诉已提交");
          setTimeout(() => { setBanInfo(null); setAppealSuccess(''); }, 3000);
      } catch (err: any) { alert(err.message); }
  };
  
  const handlePwdRequest = async (e: React.FormEvent) => {
      e.preventDefault();
      setPwdError(''); setPwdSuccess(''); setPwdLoading(true);
      try {
          if (!pwdRequestData.username) throw new Error("请输入账号");
          let contactInfo = '';
          if (pwdTab === 'RESET') {
              if (!pwdRequestData.newPassword) throw new Error("请输入新密码");
              contactInfo = `Contact: ${pwdRequestData.contact}`;
          } else {
               if (!pwdRequestData.wechat && !pwdRequestData.phone) throw new Error("请填写联系方式");
               contactInfo = `Phone: ${pwdRequestData.phone} WC: ${pwdRequestData.wechat}`;
          }
          await createPasswordRequest({
              username: pwdRequestData.username, requestType: pwdTab, newPassword: pwdRequestData.newPassword, contactInfo
          });
          setPwdSuccess("提交成功");
          setTimeout(() => setShowForgotPwd(false), 2000);
      } catch (e: any) { setPwdError(e.message); }
      finally { setPwdLoading(false); }
  };

  // 如果站长还没有在代码里填配置，显示部署引导页
  if (!isReady) {
      return (
        <div className="w-[600px] max-w-[95vw] bg-[#09090b] border border-red-500/30 p-10 rounded-lg shadow-2xl animate-in zoom-in-95">
            <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <ServerCrash size={40} className="text-red-500" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">网站尚未配置数据库</h2>
                <p className="text-gray-400 text-sm mb-8 leading-relaxed max-w-md">
                    检测到 <code>firebaseConfig.ts</code> 文件仍包含默认占位符。
                    为了实现全网数据同步，您需要先连接云端数据库。
                </p>

                <div className="w-full bg-white/5 border border-white/10 rounded-md p-6 text-left mb-8">
                    <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
                        <Database size={16} className="text-blue-500"/> 站长配置指南
                    </h3>
                    <ol className="list-decimal list-inside text-xs text-gray-400 space-y-3 font-mono">
                        <li>打开项目代码中的 <span className="text-gold-500">src/firebaseConfig.ts</span> 文件</li>
                        <li>将 <span className="text-white">YOUR_API_KEY</span> 等字段替换为您的 Firebase 真实密钥</li>
                        <li>保存文件并重新部署网站</li>
                    </ol>
                </div>

                <button 
                    onClick={() => setIsReady(true)} 
                    className="text-gray-600 hover:text-white text-xs underline decoration-dotted"
                >
                    (开发者仅供测试：强制进入单机离线模式)
                </button>
            </div>
        </div>
      );
  }

  // 正常登录界面
  return (
    <>
      <div className="fixed top-6 right-6 z-[60] flex flex-col items-end gap-3 animate-in slide-in-from-top-4 duration-700">
        <button onClick={() => onNavigate(ViewState.NOTICE_BOARD)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full transition-all w-fit text-white text-xs font-bold">
          <Bell size={14} className="text-gold-500" /> 公告栏
        </button>
        <div className="flex items-center gap-2 backdrop-blur-md border px-4 py-2 rounded-full transition-all w-fit text-xs font-bold bg-green-500/10 border-green-500/30 text-green-400">
          <Cloud size={14} /> 全网同步中
        </div>
      </div>

      <div className="w-[500px] bg-[#09090b]/80 backdrop-blur-xl border border-white/10 p-12 rounded-sm shadow-[0_0_60px_-15px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="flex flex-col items-center">
          <div className="mb-12 flex flex-col items-center">
            <div className="w-28 h-28 border-2 border-white flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)] bg-black/40">
              <span className="text-6xl text-white font-serif font-bold">黑</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-[0.2em] text-center brand-font">黑马相亲</h1>
            <p className="text-xs text-gray-500 uppercase tracking-[0.6em] font-light">BLACK HORSE DATING</p>
          </div>

          <div className="w-full">
            {error && <div className="mb-6 p-3 bg-red-900/20 border-l-2 border-red-500 text-red-200 text-xs text-center">{error}</div>}
            <form onSubmit={handleSubmit}>
              <Input label="账号" labelEn="ACCOUNT" placeholder="请输入您的账号" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              <div className="relative">
                <Input label="密码" labelEn="PASSWORD" type="password" placeholder="请输入您的密码" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                <button type="button" onClick={() => setShowForgotPwd(true)} className="absolute right-0 top-0 text-[10px] text-gray-500 hover:text-gold-500 mt-2 mr-1">忘记密码?</button>
              </div>
              <button type="submit" disabled={loading} className="w-full mt-10 bg-white text-black font-bold text-sm py-4 px-6 rounded-sm hover:bg-gray-200 flex items-center justify-center gap-2 group tracking-[0.2em]">
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>立即进入 <ChevronRight size={14} className="group-hover:translate-x-1" /></>}
              </button>
            </form>
            <div className="mt-10 text-center space-y-8">
              <button onClick={() => onNavigate(ViewState.REGISTER)} className="text-gray-500 hover:text-white text-xs tracking-widest">还没有入场券? <span className="text-white border-b border-white/30 ml-1">使用邀请码注册</span></button>
              <div className="pt-6 border-t border-white/5">
                <button onClick={() => onNavigate(ViewState.ADMIN_LOGIN)} className="text-gray-700 hover:text-gray-500 text-[10px] flex items-center justify-center gap-2 uppercase tracking-[0.2em]">
                  <div className="w-1 h-1 rounded-full bg-gray-700"></div> 管理员通道
                </button>
              </div>
            </div>
          </div>
        </div>

        {banInfo && (
            <div className="absolute inset-0 z-[100] bg-[#0c0c0e] flex flex-col items-center justify-center p-8 animate-in zoom-in-95">
                <Ban className="text-red-500 mb-4" size={40} />
                <h3 className="text-xl font-bold text-white mb-2">账户被封禁</h3>
                <p className="text-red-400 text-xs mb-4">解封时间: {banInfo.date}</p>
                {!appealSuccess ? (
                    <form onSubmit={handleAppealSubmit} className="w-full space-y-3">
                        <Input label="联系方式" value={appealContact} onChange={e => setAppealContact(e.target.value)} placeholder="WeChat / Phone" />
                        <div className="flex gap-2"><button type="button" onClick={()=>setBanInfo(null)} className="flex-1 py-2 border border-white/10 text-gray-400 text-xs">取消</button><button className="flex-1 py-2 bg-red-600 text-white text-xs">申诉</button></div>
                    </form>
                ) : <div className="text-green-500 text-sm">已提交</div>}
            </div>
        )}
        
        {showForgotPwd && (
            <div className="absolute inset-0 z-50 bg-[#09090b] flex flex-col p-8 animate-in zoom-in-95">
                <div className="flex justify-between mb-4"><h3 className="text-white font-bold flex gap-2"><Lock size={16} /> 密码找回</h3><button onClick={()=>setShowForgotPwd(false)}><X size={16} className="text-gray-500"/></button></div>
                {!pwdSuccess ? (
                  <form onSubmit={handlePwdRequest} className="space-y-4">
                      {pwdError && <p className="text-red-500 text-xs">{pwdError}</p>}
                      <div className="flex gap-4 border-b border-white/10 mb-2"><button type="button" onClick={()=>setPwdTab('RESET')} className={`pb-2 text-xs ${pwdTab==='RESET'?'text-white border-b border-gold-500':'text-gray-500'}`}>重置</button><button type="button" onClick={()=>setPwdTab('RETRIEVE')} className={`pb-2 text-xs ${pwdTab==='RETRIEVE'?'text-white border-b border-gold-500':'text-gray-500'}`}>找回</button></div>
                      <Input label="账号" value={pwdRequestData.username} onChange={e=>setPwdRequestData({...pwdRequestData, username: e.target.value})} />
                      {pwdTab === 'RESET' && <Input label="新密码" value={pwdRequestData.newPassword} onChange={e=>setPwdRequestData({...pwdRequestData, newPassword: e.target.value})} />}
                      <Input label="联系方式" value={pwdRequestData.phone} onChange={e=>setPwdRequestData({...pwdRequestData, phone: e.target.value})} placeholder="电话/微信" />
                      <button className="w-full bg-gold-600 py-3 text-black text-xs font-bold mt-4">{pwdLoading?'...':'提交'}</button>
                  </form>
                ) : <div className="flex-1 flex items-center justify-center text-green-500 flex-col"><CheckCircle size={40}/><p className="mt-2">提交成功</p></div>}
            </div>
        )}
      </div>
    </>
  );
};