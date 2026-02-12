import React, { useEffect, useState } from 'react';
import { User, InvitationCode, ViewState, PasswordRequest, Notice, BanAppeal } from '../types';
import { getUsers, getInvitationCodes, generateInvitationCode, deleteInvitationCode, adminCreateUser, deleteUser, clearData, exportDatabase, importDatabase, getPasswordRequests, resolvePasswordRequest, deletePasswordRequest, adminResetPassword, getNotices, createNotice, deleteNotice, banUser, unbanUser, getBanAppeals, resolveBanAppeal, deleteBanAppeal } from '../services/mockBackend';
import { Search, LogOut, Trash2, Users, Ticket, Plus, X, RotateCw, Copy, Download, Upload, ShieldAlert, Lock, AlertTriangle, Bell, Pin, Ban, UserX } from 'lucide-react';

interface AdminDashboardProps {
  onNavigate: (view: ViewState) => void;
}

type Tab = 'users' | 'invites' | 'security' | 'notices';

interface ActionState {
  type: 'APPROVE_RESET' | 'REJECT_REQUEST' | 'DELETE_USER' | 'DELETE_CODE' | 'RESET_SYSTEM' | 'DELETE_NOTICE' | 'UNBAN_USER' | 'RESOLVE_APPEAL' | 'DELETE_APPEAL';
  title: string;
  message: string;
  data?: any;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<InvitationCode[]>([]);
  const [pwdRequests, setPwdRequests] = useState<PasswordRequest[]>([]);
  const [banAppeals, setBanAppeals] = useState<BanAppeal[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', age: '', contactType: 'wechat' as 'wechat' | 'phone', contactValue: '' });
  const [banModalTarget, setBanModalTarget] = useState<User | null>(null);
  const [banDuration, setBanDuration] = useState('1440');
  const [showCreateNotice, setShowCreateNotice] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', isImportant: false });
  const [actionState, setActionState] = useState<ActionState | null>(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityPin, setSecurityPin] = useState('');
  const [pendingRevealId, setPendingRevealId] = useState<string | null>(null);
  const [revealedPassword, setRevealedPassword] = useState<{username: string, password: string} | null>(null);

  const refreshData = async () => {
    setUsers(await getUsers());
    setInvites(await getInvitationCodes());
    setPwdRequests(await getPasswordRequests());
    setNotices(await getNotices());
    setBanAppeals(await getBanAppeals());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleLogout = () => {
    onNavigate(ViewState.LOGIN);
  };

  const promptGenerateCode = async () => {
    await generateInvitationCode();
    refreshData();
  };

  const promptDeleteCode = (id: string) => { setActionState({ type: 'DELETE_CODE', title: '删除邀请码', message: '确认删除此邀请码？', data: { id } }); };
  const promptDeleteUser = (id: string) => { setActionState({ type: 'DELETE_USER', title: '删除用户', message: '确认删除此用户？此操作不可恢复，用户数据将永久丢失。', data: { id } }); };
  const promptUnbanUser = (id: string) => { setActionState({ type: 'UNBAN_USER', title: '解除封禁', message: '确认立即解封此用户账号？', data: { id } }); };
  const promptDeleteNotice = (id: string) => { setActionState({ type: 'DELETE_NOTICE', title: '删除公告', message: '确认删除此条公告？', data: { id } }); };
  const promptResetSystem = () => { setActionState({ type: 'RESET_SYSTEM', title: '重置系统', message: '警告：这将清空所有用户、消息、邀请码和公告数据！确定要继续吗？', data: {} }); };

  const promptApproveReset = (req: PasswordRequest) => {
    const targetUser = req.username;
    const targetPwd = req.newPassword || '888888';
    const isModification = !!req.newPassword;
    setActionState({
      type: 'APPROVE_RESET',
      title: isModification ? '确认修改密码' : '确认重置密码',
      message: isModification ? `系统将自动把用户 [${targetUser}] 的密码修改为 "${targetPwd}"。确认执行？` : `系统将自动把用户 [${targetUser}] 的密码重置为默认值 "888888"。确认执行？`,
      data: { requestId: req.id, username: targetUser, password: targetPwd }
    });
  };

  const promptRejectRequest = (id: string) => { setActionState({ type: 'REJECT_REQUEST', title: '拒绝申请', message: '确认拒绝并删除此条申请记录吗？', data: { id } }); };
  const promptResolveAppeal = (id: string) => { setActionState({ type: 'RESOLVE_APPEAL', title: '标记已处理', message: '确认将此申诉标记为已处理？', data: { id } }); };
  const promptDeleteAppeal = (id: string) => { setActionState({ type: 'DELETE_APPEAL', title: '删除记录', message: '确认删除此条申诉记录？', data: { id } }); };

  const executeAction = async () => {
    if (!actionState) return;
    try {
      switch (actionState.type) {
        case 'DELETE_USER': await deleteUser(actionState.data.id); break;
        case 'DELETE_CODE': await deleteInvitationCode(actionState.data.id); break;
        case 'RESET_SYSTEM': await clearData(); break;
        case 'REJECT_REQUEST': await deletePasswordRequest(actionState.data.id); break;
        case 'DELETE_NOTICE': await deleteNotice(actionState.data.id); break;
        case 'UNBAN_USER': await unbanUser(actionState.data.id); break;
        case 'RESOLVE_APPEAL': await resolveBanAppeal(actionState.data.id); break;
        case 'DELETE_APPEAL': await deleteBanAppeal(actionState.data.id); break;
        case 'APPROVE_RESET':
          const { username, password, requestId } = actionState.data;
          const success = await adminResetPassword(username, password);
          if (success) await resolvePasswordRequest(requestId);
          else { alert(`操作失败：未找到用户 [${username}]`); setActionState(null); return; }
          break;
      }
      refreshData();
      setActionState(null);
    } catch (e: any) { alert("操作失败: " + e.message); }
  };

  const handleBanSubmit = async () => {
      if (!banModalTarget) return;
      await banUser(banModalTarget.id, parseInt(banDuration));
      setBanModalTarget(null);
      refreshData();
  };

  const handleExport = async () => {
    const json = await exportDatabase();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blackhorse_db_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const text = await file.text();
        if (await importDatabase(text)) {
          alert('数据库导入成功！');
          refreshData();
        } else {
          alert('导入失败，文件格式错误');
        }
      }
    };
    input.click();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newUser.username || !newUser.password || !newUser.age || !newUser.contactValue) { alert('请填写完整信息'); return; }
      await adminCreateUser({
        username: newUser.username.trim(), password: newUser.password, age: parseInt(newUser.age), contactType: newUser.contactType, contactValue: newUser.contactValue.trim()
      });
      setShowCreateUser(false);
      setNewUser({ username: '', password: '', age: '', contactType: 'wechat', contactValue: '' });
      refreshData();
      alert('用户开户成功');
    } catch (err: any) { alert(err.message || '开户失败'); }
  };
  
  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return alert("请填写完整");
    await createNotice(newNotice.title, newNotice.content, newNotice.isImportant);
    setNewNotice({ title: '', content: '', isImportant: false });
    setShowCreateNotice(false);
    refreshData();
  };

  const handleViewPasswordClick = (requestId: string) => { setPendingRevealId(requestId); setSecurityPin(''); setShowSecurityModal(true); };
  const verifySecurityPin = async () => {
    if (securityPin === '208208') {
      const request = pwdRequests.find(r => r.id === pendingRevealId);
      if (request) {
        const targetUser = users.find(u => u.username === request.username);
        if (targetUser && targetUser.password) {
          setRevealedPassword({ username: targetUser.username, password: targetUser.password });
          await resolvePasswordRequest(request.id);
          refreshData();
        } else alert("无法找到该用户或密码数据");
      }
      setShowSecurityModal(false);
    } else { alert("二级密码错误！"); setSecurityPin(''); }
  };

  const filteredUsers = users.filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()) || (user.uid && user.uid.includes(searchTerm)) || user.contactValue.includes(searchTerm));

  return (
    <div className="w-full max-w-[1400px] px-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 pb-6 border-b border-white/5">
        <div><h2 className="text-4xl font-bold text-white brand-font tracking-wide mb-2">后台管理系统</h2><div className="flex items-center gap-3"><p className="text-gray-400 text-sm tracking-wider">ADMINISTRATOR DASHBOARD</p><div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full"><div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div><span className="text-[10px] text-green-400 font-bold tracking-wider">DB CONNECTED</span></div></div></div>
        <div className="flex items-center gap-3">
           <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-sm hover:bg-blue-500/20 transition-colors text-xs tracking-wider"><Download size={14} /> 备份</button>
           <button onClick={handleImport} className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-sm hover:bg-blue-500/20 transition-colors text-xs tracking-wider"><Upload size={14} /> 恢复</button>
           <button onClick={promptResetSystem} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-sm hover:bg-red-500/20 transition-colors text-xs tracking-wider"><RotateCw size={14} /> 重置系统</button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-gray-300 border border-white/10 rounded-sm hover:bg-white/10 transition-colors text-xs tracking-wider"><LogOut size={14} /> 退出</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-[#09090b] border border-white/10 p-6 rounded-sm"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-gold-500/10 rounded-sm"><Users className="text-gold-500" size={20} /></div><span className="text-[10px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full">LIVE</span></div><h3 className="text-3xl font-bold text-white mb-1">{users.length}</h3><p className="text-gray-500 text-xs tracking-wider">总注册用户</p></div>
        <div className="bg-[#09090b] border border-white/10 p-6 rounded-sm"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-blue-500/10 rounded-sm"><Ticket className="text-blue-500" size={20} /></div></div><h3 className="text-3xl font-bold text-white mb-1">{invites.filter(i => !i.isUsed).length}</h3><p className="text-gray-500 text-xs tracking-wider">可用邀请码</p></div>
        <div className="bg-[#09090b] border border-white/10 p-6 rounded-sm"><div className="flex justify-between items-start mb-4"><div className="p-2 bg-red-500/10 rounded-sm"><ShieldAlert className="text-red-500" size={20} /></div>{(pwdRequests.filter(r => r.status === 'PENDING').length + banAppeals.filter(r => r.status === 'PENDING').length) > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}</div><h3 className="text-3xl font-bold text-white mb-1">{pwdRequests.filter(r => r.status === 'PENDING').length + banAppeals.filter(r => r.status === 'PENDING').length}</h3><p className="text-gray-500 text-xs tracking-wider">待处理安全请求</p></div>
        <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 p-6 rounded-sm flex flex-col justify-center items-center cursor-pointer hover:border-white/30 transition-colors" onClick={() => setShowCreateUser(true)}><div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mb-3"><Plus className="text-white" size={24} /></div><p className="text-white text-sm font-bold tracking-widest">直接开户</p><p className="text-gray-400 text-[10px] mt-1">管理员权限</p></div>
      </div>

      <div className="flex gap-8 border-b border-white/10 mb-6">
        <button onClick={() => setActiveTab('users')} className={`pb-4 text-sm font-medium tracking-widest transition-colors ${activeTab === 'users' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}>用户列表</button>
        <button onClick={() => setActiveTab('invites')} className={`pb-4 text-sm font-medium tracking-widest transition-colors ${activeTab === 'invites' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}>邀请码管理</button>
        <button onClick={() => setActiveTab('security')} className={`pb-4 text-sm font-medium tracking-widest transition-colors flex items-center gap-2 ${activeTab === 'security' ? 'text-red-400 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'}`}>安全中心 {(pwdRequests.filter(r => r.status === 'PENDING').length + banAppeals.filter(r => r.status === 'PENDING').length) > 0 && <span className="bg-red-500 text-black text-[9px] px-1.5 py-0.5 rounded-full font-bold">{pwdRequests.filter(r => r.status === 'PENDING').length + banAppeals.filter(r => r.status === 'PENDING').length}</span>}</button>
        <button onClick={() => setActiveTab('notices')} className={`pb-4 text-sm font-medium tracking-widest transition-colors ${activeTab === 'notices' ? 'text-white border-b-2 border-white' : 'text-gray-500 hover:text-gray-300'}`}>公告管理</button>
      </div>

      <div className="bg-[#09090b] border border-white/10 rounded-sm overflow-hidden min-h-[400px]">
        {activeTab === 'users' && (
          <>
            <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between gap-4">
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} /><input type="text" placeholder="搜索用户或UID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/5 border border-white/10 rounded-sm pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-white/30 w-full md:w-64 transition-all" /></div>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs text-gray-400"><thead className="bg-white/5 text-gray-200 uppercase tracking-wider font-medium"><tr><th className="px-6 py-4">UID</th><th className="px-6 py-4">账号</th><th className="px-6 py-4">昵称</th><th className="px-6 py-4">密码</th><th className="px-6 py-4">年龄</th><th className="px-6 py-4">状态</th><th className="px-6 py-4 text-right">操作</th></tr></thead><tbody className="divide-y divide-white/5">{filteredUsers.length > 0 ? (filteredUsers.map((user) => (<tr key={user.id} className={`hover:bg-white/5 transition-colors ${user.isBanned ? 'bg-red-900/10' : ''}`}><td className="px-6 py-4 font-mono text-gold-500">{user.uid || '---'}</td><td className="px-6 py-4 font-bold text-white">{user.username}</td><td className="px-6 py-4 text-gray-300">{user.displayName || user.username}</td><td className="px-6 py-4 font-mono text-white/80 bg-white/5 px-2 rounded-sm w-fit my-3">{user.password}</td><td className="px-6 py-4">{user.age}</td><td className="px-6 py-4">{user.isBanned ? <div className="flex flex-col"><span className="text-red-500 font-bold flex items-center gap-1"><Ban size={12}/> 已封禁</span><span className="text-[10px] text-gray-500">至: {new Date(user.banExpiresAt!).toLocaleDateString()}</span></div> : <span className="text-green-500">正常</span>}</td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-3">{user.isBanned ? <button onClick={() => promptUnbanUser(user.id)} className="text-green-500 hover:text-green-400 transition-colors text-xs border border-green-500/30 px-2 py-1 rounded">解封</button> : <button onClick={() => setBanModalTarget(user)} className="text-yellow-500 hover:text-yellow-400 transition-colors text-xs border border-yellow-500/30 px-2 py-1 rounded">风控</button>}<button onClick={() => promptDeleteUser(user.id)} className="text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button></div></td></tr>))) : (<tr><td colSpan={7} className="px-6 py-12 text-center text-gray-600">暂无数据</td></tr>)}</tbody></table></div>
          </>
        )}
        
        {activeTab === 'invites' && (
          <>
             <div className="p-6 border-b border-white/10 flex justify-between items-center"><p className="text-gray-400 text-xs">管理注册邀请码</p><button onClick={promptGenerateCode} className="bg-white text-black px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-200 transition-colors flex items-center gap-2 rounded-sm"><Plus size={14} /> 生成邀请码</button></div>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs text-gray-400"><thead className="bg-white/5 text-gray-200 uppercase tracking-wider font-medium"><tr><th className="px-6 py-4">邀请码</th><th className="px-6 py-4">状态</th><th className="px-6 py-4">使用者</th><th className="px-6 py-4">生成时间</th><th className="px-6 py-4 text-right">操作</th></tr></thead><tbody className="divide-y divide-white/5">{invites.length > 0 ? (invites.map((invite) => (<tr key={invite.id} className="hover:bg-white/5 transition-colors"><td className="px-6 py-4 font-mono text-gold-500 text-sm tracking-wider flex items-center gap-2 group cursor-pointer" onClick={() => navigator.clipboard.writeText(invite.code)}>{invite.code} <Copy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" /></td><td className="px-6 py-4">{invite.isUsed ? <span className="text-red-400 text-[10px] bg-red-900/20 px-2 py-0.5 rounded-full">已使用</span> : <span className="text-green-400 text-[10px] bg-green-900/20 px-2 py-0.5 rounded-full">未使用</span>}</td><td className="px-6 py-4 text-white">{invite.usedBy || '-'}</td><td className="px-6 py-4 text-gray-600">{new Date(invite.createdAt).toLocaleString('zh-CN')}</td><td className="px-6 py-4 text-right"><button onClick={() => promptDeleteCode(invite.id)} className="text-gray-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button></td></tr>))) : (<tr><td colSpan={5} className="px-6 py-12 text-center text-gray-600">暂无邀请码</td></tr>)}</tbody></table></div>
          </>
        )}

        {activeTab === 'security' && (
           <>
            <div className="p-6 border-b border-white/10 flex justify-between items-center"><p className="text-gray-400 text-xs">处理用户密码更改与封号申诉</p></div>
             <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-400"><thead className="bg-white/5 text-gray-200 uppercase tracking-wider font-medium"><tr><th className="px-6 py-4">申请账号</th><th className="px-6 py-4">申请类型</th><th className="px-6 py-4">详情/联系方式</th><th className="px-6 py-4">状态</th><th className="px-6 py-4">提交时间</th><th className="px-6 py-4 text-right">操作</th></tr></thead><tbody className="divide-y divide-white/5">
                  {pwdRequests.map((req) => (<tr key={req.id} className="hover:bg-white/5 transition-colors"><td className="px-6 py-4 font-bold text-white">{req.username}</td><td className="px-6 py-4">{req.requestType === 'RESET' ? <span className="text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded-sm border border-blue-500/20">改密申请</span> : <span className="text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded-sm border border-purple-500/20">查看申请</span>}</td><td className="px-6 py-4 text-gray-300 max-w-xs"><div className="flex flex-col">{req.newPassword && <span className="text-gold-500 font-mono">新密码: {req.newPassword}</span>}<span className="text-[10px] text-gray-500">{req.contactInfo}</span></div></td><td className="px-6 py-4">{req.status === 'PENDING' ? <span className="text-yellow-500">待处理</span> : <span className="text-green-500">已解决</span>}</td><td className="px-6 py-4 text-gray-600">{new Date(req.createdAt).toLocaleString('zh-CN')}</td><td className="px-6 py-4 text-right">{req.status === 'PENDING' ? (<div className="flex items-center justify-end gap-2">{req.requestType === 'RESET' ? <button onClick={() => promptApproveReset(req)} className="px-2 py-1 bg-blue-600 text-white rounded-sm text-[10px]">改密</button> : <button onClick={() => handleViewPasswordClick(req.id)} className="px-2 py-1 bg-purple-600 text-white rounded-sm text-[10px]">查看</button>}<button onClick={() => promptRejectRequest(req.id)} className="text-red-500"><X size={14} /></button></div>) : <button onClick={() => promptRejectRequest(req.id)} className="text-gray-600 hover:text-white"><Trash2 size={14} /></button>}</td></tr>))}
                  {banAppeals.map((appeal) => (<tr key={appeal.id} className="hover:bg-white/5 transition-colors"><td className="px-6 py-4 font-bold text-white">{appeal.username}</td><td className="px-6 py-4"><span className="text-red-400 bg-red-900/20 px-2 py-0.5 rounded-sm border border-red-500/20">封禁申诉</span></td><td className="px-6 py-4 text-gray-300 font-bold">{appeal.contactInfo}</td><td className="px-6 py-4">{appeal.status === 'PENDING' ? <span className="text-yellow-500">待处理</span> : <span className="text-green-500">已联系</span>}</td><td className="px-6 py-4 text-gray-600">{new Date(appeal.createdAt).toLocaleString('zh-CN')}</td><td className="px-6 py-4 text-right">{appeal.status === 'PENDING' ? (<div className="flex items-center justify-end gap-2"><button onClick={() => promptResolveAppeal(appeal.id)} className="px-2 py-1 bg-green-600 text-white rounded-sm text-[10px]">标记已阅</button><button onClick={() => promptDeleteAppeal(appeal.id)} className="text-red-500"><X size={14} /></button></div>) : <button onClick={() => promptDeleteAppeal(appeal.id)} className="text-gray-600 hover:text-white"><Trash2 size={14} /></button>}</td></tr>))}
                  {(pwdRequests.length === 0 && banAppeals.length === 0) && (<tr><td colSpan={7} className="px-6 py-12 text-center text-gray-600">暂无安全请求</td></tr>)}</tbody></table></div>
           </>
        )}

        {activeTab === 'notices' && (
           <>
            <div className="p-6 border-b border-white/10 flex justify-between items-center"><p className="text-gray-400 text-xs">发布全站公告（登录页可见）</p><button onClick={() => setShowCreateNotice(true)} className="bg-white text-black px-4 py-2 text-xs font-bold tracking-wider hover:bg-gray-200 transition-colors flex items-center gap-2 rounded-sm"><Plus size={14} /> 发布公告</button></div>
            <div className="overflow-x-auto"><table className="w-full text-left text-xs text-gray-400"><thead className="bg-white/5 text-gray-200 uppercase tracking-wider font-medium"><tr><th className="px-6 py-4">标题</th><th className="px-6 py-4">内容摘要</th><th className="px-6 py-4">发布时间</th><th className="px-6 py-4 text-right">操作</th></tr></thead><tbody className="divide-y divide-white/5">{notices.length > 0 ? (notices.map((notice) => (<tr key={notice.id} className="hover:bg-white/5 transition-colors"><td className="px-6 py-4 font-bold text-white flex items-center gap-2">{notice.isImportant && <Pin size={12} className="text-red-500" />}{notice.title}</td><td className="px-6 py-4 text-gray-300 max-w-md truncate">{notice.content}</td><td className="px-6 py-4 text-gray-600">{new Date(notice.createdAt).toLocaleString('zh-CN')}</td><td className="px-6 py-4 text-right"><button onClick={() => promptDeleteNotice(notice.id)} className="text-red-500/50 hover:text-red-500 transition-colors"><Trash2 size={14} /></button></td></tr>))) : (<tr><td colSpan={4} className="px-6 py-12 text-center text-gray-600">暂无公告</td></tr>)}</tbody></table></div>
           </>
        )}
      </div>

      {actionState && (<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-[#111] border border-white/10 w-full max-w-sm p-6 rounded-sm shadow-2xl animate-in zoom-in-95 relative"><button onClick={() => setActionState(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button><div className="flex flex-col items-center text-center"><div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4"><AlertTriangle className="text-gold-500" size={24} /></div><h3 className="text-lg font-bold text-white mb-2">{actionState.title}</h3><p className="text-gray-400 text-xs mb-6 leading-relaxed">{actionState.message}</p><div className="flex gap-3 w-full"><button onClick={() => setActionState(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-sm transition-colors">取消</button><button onClick={executeAction} className="flex-1 py-3 bg-gold-600 hover:bg-gold-500 text-black font-bold text-xs rounded-sm transition-colors">确认执行</button></div></div></div></div>)}

      {banModalTarget && (<div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-[#111] border border-red-500/30 w-full max-w-sm p-6 rounded-sm shadow-2xl animate-in zoom-in-95 relative"><button onClick={() => setBanModalTarget(null)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button><div className="flex flex-col items-center text-center"><div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mb-4"><UserX className="text-red-500" size={24} /></div><h3 className="text-lg font-bold text-white mb-1">账号风控封禁</h3><p className="text-gray-400 text-xs mb-6">对用户 [{banModalTarget.username}] 进行封号处理。<br />封禁期间用户将无法登录，到期自动解封。</p><div className="w-full mb-6"><label className="text-left text-gray-500 text-xs mb-2 block">封禁时长</label><select value={banDuration} onChange={(e) => setBanDuration(e.target.value)} className="w-full bg-black border border-white/20 text-white p-3 rounded-sm text-sm focus:border-red-500 outline-none"><option value="60">1 小时</option><option value="1440">1 天</option><option value="4320">3 天</option><option value="10080">7 天</option><option value="43200">30 天</option><option value="52560000">永久 (100年)</option></select></div><div className="flex gap-3 w-full"><button onClick={() => setBanModalTarget(null)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs rounded-sm transition-colors">取消</button><button onClick={handleBanSubmit} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-sm transition-colors">确认封禁</button></div></div></div></div>)}

      {showCreateUser && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-[#09090b] border border-white/20 w-full max-w-md p-8 rounded-sm shadow-2xl relative animate-in zoom-in-95 duration-200"><button onClick={() => setShowCreateUser(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button><h3 className="text-xl font-bold text-white mb-6 brand-font">管理员直接开户</h3><form onSubmit={handleCreateUser}><div className="space-y-4"><div><label className="block text-gray-400 text-xs mb-1">用户名</label><input className="w-full bg-white/5 border border-white/10 p-2 text-white text-sm focus:border-white/30 outline-none" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} /></div><div><label className="block text-gray-400 text-xs mb-1">密码</label><input type="text" className="w-full bg-white/5 border border-white/10 p-2 text-white text-sm focus:border-white/30 outline-none" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div><div className="flex gap-4"><div className="w-1/3"><label className="block text-gray-400 text-xs mb-1">年龄</label><input type="number" className="w-full bg-white/5 border border-white/10 p-2 text-white text-sm focus:border-white/30 outline-none" value={newUser.age} onChange={e => setNewUser({...newUser, age: e.target.value})} /></div><div className="flex-1"><label className="block text-gray-400 text-xs mb-1">联系方式 ({newUser.contactType})</label><input className="w-full bg-white/5 border border-white/10 p-2 text-white text-sm focus:border-white/30 outline-none" value={newUser.contactValue} onChange={e => setNewUser({...newUser, contactValue: e.target.value})} /></div></div></div><button className="w-full mt-8 bg-white text-black font-bold py-3 text-sm hover:bg-gray-200 tracking-widest">确认开户</button></form></div></div>)}

      {showCreateNotice && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className="bg-[#09090b] border border-white/20 w-full max-w-lg p-8 rounded-sm shadow-2xl relative animate-in zoom-in-95 duration-200"><button onClick={() => setShowCreateNotice(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20} /></button><h3 className="text-xl font-bold text-white mb-6 brand-font flex items-center gap-2"><Bell size={20} className="text-gold-500" /> 发布公告</h3><form onSubmit={handleCreateNotice}><div className="space-y-4"><div><label className="block text-gray-400 text-xs mb-1">标题</label><input className="w-full bg-white/5 border border-white/10 p-3 text-white text-sm focus:border-white/30 outline-none" placeholder="公告标题" value={newNotice.title} onChange={e => setNewNotice({...newNotice, title: e.target.value})} /></div><div><label className="block text-gray-400 text-xs mb-1">内容</label><textarea className="w-full h-32 bg-white/5 border border-white/10 p-3 text-white text-sm focus:border-white/30 outline-none resize-none" placeholder="输入公告内容..." value={newNotice.content} onChange={e => setNewNotice({...newNotice, content: e.target.value})} /></div><div className="flex items-center gap-2 cursor-pointer" onClick={() => setNewNotice({...newNotice, isImportant: !newNotice.isImportant})}><div className={`w-4 h-4 border border-white/30 flex items-center justify-center ${newNotice.isImportant ? 'bg-red-500 border-red-500' : ''}`}>{newNotice.isImportant && <X size={10} className="text-white" />}</div><span className="text-gray-400 text-xs">标记为重要</span></div></div><button className="w-full mt-8 bg-white text-black font-bold py-3 text-sm hover:bg-gray-200 tracking-widest">立即发布</button></form></div></div>)}

      {showSecurityModal && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"><div className="bg-[#111] border border-red-500/30 w-full max-w-sm p-8 rounded-sm shadow-2xl relative animate-in zoom-in-95 duration-200 text-center"><button onClick={() => setShowSecurityModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={18} /></button><ShieldAlert className="text-red-500 mx-auto mb-4" size={48} /><h3 className="text-xl font-bold text-white mb-2">安全验证</h3><p className="text-gray-400 text-xs mb-6">查看用户明文密码需要输入二级管理密码</p><input type="password" className="w-full bg-black border border-white/20 p-3 text-center text-white text-lg tracking-[0.5em] focus:border-red-500 outline-none mb-6 font-mono" placeholder="******" value={securityPin} onChange={e => setSecurityPin(e.target.value)} maxLength={6} /><button onClick={verifySecurityPin} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-sm transition-colors text-sm tracking-widest">验证并查看</button></div></div>)}

      {revealedPassword && (<div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-4" onClick={() => setRevealedPassword(null)}><div className="bg-[#0c0c0e] border border-white/20 p-8 rounded-sm shadow-2xl text-center animate-in zoom-in-95" onClick={e => e.stopPropagation()}><Lock className="text-green-500 mx-auto mb-4" size={40} /><p className="text-gray-400 text-xs uppercase tracking-widest mb-2">Password for {revealedPassword.username}</p><h2 className="text-4xl text-white font-mono font-bold tracking-wider mb-6 select-all bg-white/5 p-4 rounded border border-white/10">{revealedPassword.password}</h2><button onClick={() => setRevealedPassword(null)} className="text-gray-500 hover:text-white text-xs underline">关闭窗口</button></div></div>)}
    </div>
  );
};