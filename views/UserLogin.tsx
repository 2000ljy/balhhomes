import React, { useState } from 'react';
import { ViewState } from '../types';
import { loginUser, createPasswordRequest, submitBanAppeal } from '../services/mockBackend';
import { Input } from '../components/Input';
import { ChevronRight, Loader2, X, Lock, Eye, CheckCircle, Bell, Ban, ShieldAlert } from 'lucide-react';

interface UserLoginProps {
  onNavigate: (view: ViewState) => void;
  onLoginSuccess: () => void;
}

export const UserLogin: React.FC<UserLoginProps> = ({ onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password Modal State
  const [showForgotPwd, setShowForgotPwd] = useState(false);
  const [pwdTab, setPwdTab] = useState<'RESET' | 'RETRIEVE'>('RESET');
  const [pwdRequestData, setPwdRequestData] = useState({
    username: '',
    newPassword: '',
    contact: '',
    wechat: '',
    phone: '',
    email: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Ban Appeal State
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
          setBanInfo({
              date: parts[1],
              username: parts[2]
          });
      } else {
          setError(msg || '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppealSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(!appealContact || !banInfo) return;
      
      try {
          submitBanAppeal(banInfo.username, appealContact);
          setAppealSuccess("申诉已提交，管理员会尽快联系您");
          setTimeout(() => {
              setBanInfo(null);
              setAppealSuccess('');
              setAppealContact('');
          }, 3000);
      } catch (err: any) {
          alert(err.message);
      }
  };

  const handlePwdRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');
    setPwdLoading(true);

    try {
      if (!pwdRequestData.username) throw new Error("请输入您的账号");
      
      const cleanUsername = pwdRequestData.username.trim();

      let contactInfo = '';
      if (pwdTab === 'RESET') {
         if (!pwdRequestData.newPassword) throw new Error("请输入您想要设置的新密码");
         if (!pwdRequestData.contact) throw new Error("请输入联系方式");
         contactInfo = `Contact: ${pwdRequestData.contact}`;
      } else {
         if (!pwdRequestData.wechat && !pwdRequestData.phone && !pwdRequestData.email) {
           throw new Error("请至少填写一种联系方式以便核实身份");
         }
         const details = [];
         if (pwdRequestData.phone) details.push(`Phone: ${pwdRequestData.phone}`);
         if (pwdRequestData.wechat) details.push(`WeChat: ${pwdRequestData.wechat}`);
         if (pwdRequestData.email) details.push(`Email: ${pwdRequestData.email}`);
         contactInfo = details.join(', ');
      }

      await createPasswordRequest({
        username: cleanUsername,
        requestType: pwdTab,
        newPassword: pwdRequestData.newPassword ? pwdRequestData.newPassword.trim() : undefined, 
        contactInfo: contactInfo
      });

      setPwdSuccess("申请已提交！请等待管理员审核。");
      setTimeout(() => {
        setShowForgotPwd(false);
        setPwdSuccess('');
        setPwdRequestData({ username: '', newPassword: '', contact: '', wechat: '', phone: '', email: '' });
      }, 2000);

    } catch (err: any) {
      setPwdError(err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <>
      {/* Top Right Notice Button */}
      <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-top-4 duration-700">
        <button 
          onClick={() => onNavigate(ViewState.NOTICE_BOARD)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full transition-all group shadow-[0_0_15px_rgba(255,255,255,0.05)]"
        >
          <Bell size={14} className="text-gold-500 group-hover:rotate-12 transition-transform" />
          <span className="text-white text-xs font-bold tracking-wider">公告栏</span>
        </button>
      </div>

      <div className="w-[500px] bg-[#09090b]/80 backdrop-blur-xl border border-white/10 p-12 rounded-sm shadow-[0_0_60px_-15px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-500 relative z-10">
        <div className="flex flex-col items-center">
          {/* Logo Section */}
          <div className="mb-12 flex flex-col items-center">
            <div className="w-28 h-28 border-2 border-white flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.05)] bg-black/40">
              <span className="text-6xl text-white font-serif font-bold">黑</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-[0.2em] text-center brand-font">黑马相亲</h1>
            <p className="text-xs text-gray-500 uppercase tracking-[0.6em] font-light">BLACK HORSE DATING</p>
          </div>

          <div className="w-full">
            {error && (
              <div className="mb-6 p-3 bg-red-900/20 border-l-2 border-red-500 text-red-200 text-xs text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <Input 
                label="账号"
                labelEn="ACCOUNT"
                placeholder="请输入您的账号"
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
              
              <div className="relative">
                <Input 
                  label="密码"
                  labelEn="PASSWORD"
                  type="password"
                  placeholder="请输入您的密码"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                <button 
                  type="button" 
                  onClick={() => setShowForgotPwd(true)}
                  className="absolute right-0 top-0 text-[10px] text-gray-500 hover:text-gold-500 mt-2 mr-1 transition-colors"
                >
                  忘记密码?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-10 bg-white text-black font-bold text-sm py-4 px-6 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 group tracking-[0.2em] hover:bg-gray-200 disabled:opacity-70"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <>立即进入 <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </form>

            <div className="mt-10 text-center space-y-8">
              <button 
                onClick={() => onNavigate(ViewState.REGISTER)}
                className="text-gray-500 hover:text-white text-xs transition-colors tracking-widest"
              >
                还没有入场券? <span className="text-white border-b border-white/30 pb-0.5 ml-1">使用邀请码注册</span>
              </button>
              
              <div className="pt-6 border-t border-white/5">
                <button 
                  onClick={() => onNavigate(ViewState.ADMIN_LOGIN)}
                  className="text-gray-700 hover:text-gray-500 text-[10px] flex items-center justify-center gap-2 transition-colors mx-auto uppercase tracking-[0.2em]"
                >
                  <div className="w-1 h-1 rounded-full bg-gray-700"></div>
                  管理员通道
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ban Appeal Modal */}
        {banInfo && (
            <div className="absolute inset-0 z-[100] bg-[#0c0c0e] rounded-sm flex flex-col items-center justify-center p-8 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
                    <Ban className="text-red-500" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">您的账户已被封禁</h3>
                <p className="text-red-400 text-xs mb-6 font-mono bg-red-900/10 px-3 py-1 rounded">
                    自动解封时间: {banInfo.date}
                </p>
                <div className="w-full bg-white/5 p-4 rounded-sm border border-white/10 mb-6">
                    <p className="text-gray-400 text-xs leading-relaxed text-center">
                        系统检测到您的账号存在违规行为。在封禁期结束前您将无法登录。如有异议，请填写联系方式，管理员将与您联系。
                    </p>
                </div>

                {appealSuccess ? (
                    <div className="text-green-500 flex flex-col items-center">
                        <CheckCircle size={32} className="mb-2" />
                        <p className="text-sm font-bold">{appealSuccess}</p>
                    </div>
                ) : (
                    <form onSubmit={handleAppealSubmit} className="w-full space-y-4">
                        <div>
                            <label className="text-gray-400 text-xs block mb-2">联系方式 (微信/手机号)</label>
                            <input 
                                className="w-full bg-black border border-white/20 p-3 text-white text-sm focus:border-red-500 outline-none rounded-sm"
                                placeholder="请输入您的联系方式..."
                                value={appealContact}
                                onChange={e => setAppealContact(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setBanInfo(null)}
                                className="flex-1 py-3 border border-white/10 text-gray-400 hover:bg-white/5 rounded-sm text-xs"
                            >
                                关闭
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-sm text-xs"
                            >
                                提交申诉
                            </button>
                        </div>
                    </form>
                )}
            </div>
        )}

        {/* Forgot Password Modal */}
        {showForgotPwd && (
          <div className="absolute inset-0 z-50 bg-[#09090b] rounded-sm flex flex-col animate-in zoom-in-95 duration-300 p-8">
              <button onClick={() => setShowForgotPwd(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                <X size={20} />
              </button>
              
              <h3 className="text-xl font-bold text-white mb-6 brand-font flex items-center gap-2">
                <Lock size={18} className="text-gold-500" /> 密码服务中心
              </h3>

              {pwdSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <CheckCircle size={48} className="text-green-500 mb-4" />
                  <p className="text-white text-lg font-bold">提交成功</p>
                  <p className="text-gray-500 text-xs mt-2">管理员批准后生效</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-4 mb-6 border-b border-white/10">
                    <button 
                      onClick={() => setPwdTab('RESET')}
                      className={`pb-2 text-xs font-bold tracking-wider transition-all ${pwdTab === 'RESET' ? 'text-white border-b-2 border-gold-500' : 'text-gray-500'}`}
                    >
                      申请更改密码
                    </button>
                    <button 
                      onClick={() => setPwdTab('RETRIEVE')}
                      className={`pb-2 text-xs font-bold tracking-wider transition-all ${pwdTab === 'RETRIEVE' ? 'text-white border-b-2 border-gold-500' : 'text-gray-500'}`}
                    >
                      申请查看密码
                    </button>
                  </div>

                  <form onSubmit={handlePwdRequest} className="space-y-4">
                    {pwdError && (
                      <div className="p-2 bg-red-900/20 text-red-300 text-[10px] border border-red-500/20 rounded-sm">
                        {pwdError}
                      </div>
                    )}

                    <Input 
                      label="您的账号"
                      placeholder="请输入账号"
                      value={pwdRequestData.username}
                      onChange={e => setPwdRequestData({...pwdRequestData, username: e.target.value})}
                      className="!py-2 !text-sm"
                    />

                    {pwdTab === 'RESET' ? (
                      <div className="space-y-3">
                        <div className="text-gray-400 text-[10px] mb-2 leading-relaxed bg-white/5 p-2 rounded-sm border border-white/5">
                          提交申请后，管理员通过审核将自动为您重置密码。
                        </div>
                        
                        {/* New Password Input */}
                        <Input 
                          label="新密码"
                          type="text"
                          placeholder="请输入您想要设置的密码"
                          value={pwdRequestData.newPassword}
                          onChange={e => setPwdRequestData({...pwdRequestData, newPassword: e.target.value})}
                          className="!py-2 !text-sm"
                        />

                        <Input 
                          label="联系方式"
                          placeholder="手机 / 微信 / 邮箱"
                          value={pwdRequestData.contact}
                          onChange={e => setPwdRequestData({...pwdRequestData, contact: e.target.value})}
                          className="!py-2 !text-sm"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="text-gray-400 text-[10px] mb-2 leading-relaxed bg-white/5 p-2 rounded-sm border border-white/5">
                          为了您的账户安全，查看密码需要留下详细的联系方式供管理员核实。
                        </div>
                        <Input 
                          label="手机号"
                          placeholder="选填"
                          value={pwdRequestData.phone}
                          onChange={e => setPwdRequestData({...pwdRequestData, phone: e.target.value})}
                          className="!py-2 !text-sm"
                        />
                        <Input 
                          label="微信号"
                          placeholder="选填"
                          value={pwdRequestData.wechat}
                          onChange={e => setPwdRequestData({...pwdRequestData, wechat: e.target.value})}
                          className="!py-2 !text-sm"
                        />
                        <Input 
                          label="邮箱"
                          placeholder="选填"
                          value={pwdRequestData.email}
                          onChange={e => setPwdRequestData({...pwdRequestData, email: e.target.value})}
                          className="!py-2 !text-sm"
                        />
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={pwdLoading}
                      className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 mt-4 rounded-sm transition-colors text-xs tracking-widest"
                    >
                      {pwdLoading ? <Loader2 className="animate-spin mx-auto" size={16} /> : '提交申请'}
                    </button>
                  </form>
                </>
              )}
          </div>
        )}
      </div>
    </>
  );
};