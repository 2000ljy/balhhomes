import React, { useState } from 'react';
import { ViewState } from '../types';
import { validateInvitationCode, registerUser, loginUser } from '../services/mockBackend';
import { Input } from '../components/Input';
import { ChevronRight, Loader2, ArrowLeft } from 'lucide-react';

interface RegistrationProps {
  onNavigate: (view: ViewState) => void;
  onLoginSuccess?: () => void;
}

export const Registration: React.FC<RegistrationProps> = ({ onNavigate, onLoginSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    age: '',
    contactType: 'wechat' as 'wechat' | 'phone',
    contactValue: '',
    inviteCode: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!formData.username || !formData.password || !formData.age || !formData.contactValue || !formData.inviteCode) {
      setError('请填写所有必填项');
      return;
    }

    setLoading(true);
    try {
        const isValid = await validateInvitationCode(formData.inviteCode);
        if (!isValid) throw new Error('邀请码无效或已被使用，请联系管理员获取');

        const newUser = await registerUser({
            username: formData.username.trim(), 
            password: formData.password,
            age: parseInt(formData.age),
            contactType: formData.contactType,
            contactValue: formData.contactValue.trim(),
        }, formData.inviteCode.trim());
        
        setSuccess('注册成功，正在自动登录...');
        await loginUser(newUser.username, formData.password);
        
        setTimeout(() => {
            if (onLoginSuccess) {
            onLoginSuccess();
            } else {
            onNavigate(ViewState.LOGIN);
            }
        }, 1000);
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[500px] bg-[#09090b]/80 backdrop-blur-xl border border-white/10 p-12 rounded-sm shadow-[0_0_60px_-15px_rgba(0,0,0,0.9)] animate-in fade-in zoom-in-95 duration-500">
      <div className="flex flex-col items-center">
        <button 
          onClick={() => onNavigate(ViewState.LOGIN)}
          className="self-start mb-10 text-gray-500 hover:text-white flex items-center gap-2 text-xs transition-colors tracking-wide"
        >
          <ArrowLeft size={14} /> 返回登录
        </button>

        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-3 brand-font">会员注册</h2>
          <p className="text-xs text-gray-400 uppercase tracking-[0.4em]">MEMBERSHIP REGISTRATION</p>
        </div>

        <div className="w-full">
          {error && <div className="mb-8 p-4 bg-red-900/20 border-l-2 border-red-500 text-red-200 text-xs text-center">{error}</div>}
          {success && <div className="mb-8 p-4 bg-green-900/20 border-l-2 border-green-500 text-green-200 text-xs text-center">{success}</div>}

          <form onSubmit={handleSubmit}>
            <Input label="用户名" labelEn="USERNAME" placeholder="设置用户名" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
            <Input label="密码" labelEn="PASSWORD" type="password" placeholder="设置密码" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <div className="flex gap-4">
               <div className="w-32"><Input label="年龄" labelEn="AGE" type="number" placeholder="18+" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} /></div>
               <div className="flex-1">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2 pl-1"><label className="text-gray-300 text-sm font-medium tracking-wide">联系方式</label><span className="text-[10px] text-gray-500 uppercase tracking-wider font-sans">CONTACT</span></div>
                    <div className="flex bg-white/5 border border-white/10 rounded-sm p-0.5">
                      <button type="button" onClick={() => setFormData({...formData, contactType: 'wechat'})} className={`flex-1 py-1.5 text-xs transition-all ${formData.contactType === 'wechat' ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}>微信</button>
                      <button type="button" onClick={() => setFormData({...formData, contactType: 'phone'})} className={`flex-1 py-1.5 text-xs transition-all ${formData.contactType === 'phone' ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-gray-300'}`}>手机</button>
                    </div>
                  </div>
               </div>
            </div>
            <Input label={formData.contactType === 'wechat' ? '微信号' : '手机号'} labelEn={formData.contactType === 'wechat' ? 'WECHAT ID' : 'PHONE NO'} placeholder="请输入号码" value={formData.contactValue} onChange={e => setFormData({...formData, contactValue: e.target.value})} />
            <div className="relative">
              <Input label="邀请码" labelEn="INVITE CODE" placeholder="请输入邀请码" value={formData.inviteCode} onChange={e => setFormData({...formData, inviteCode: e.target.value})} />
              <div className="absolute right-0 top-8 text-[10px] text-gray-500 italic tracking-wider">*请联系管理员获取</div>
            </div>
            <button type="submit" disabled={loading} className="w-full mt-8 bg-white text-black font-bold text-sm py-4 px-6 rounded-sm transition-all duration-300 flex items-center justify-center gap-2 group tracking-[0.2em] hover:bg-gray-200 disabled:opacity-50">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <>立即注册 <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};