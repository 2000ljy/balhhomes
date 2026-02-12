import React, { useState, useRef } from 'react';
import { User } from '../types';
import { updateUserProfile } from '../services/mockBackend';
import { Input } from '../components/Input';
import { Save, Loader2, Heart, Users, Calendar, Shield, Edit3, Image as ImageIcon, Plus, Trash2, Fingerprint, Camera } from 'lucide-react';

interface AppProfileProps {
  currentUser: User;
  onUpdateUser: (u: User) => void;
}

export const AppProfile: React.FC<AppProfileProps> = ({ currentUser, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    displayName: currentUser.displayName || currentUser.username,
    password: currentUser.password || '',
    age: currentUser.age.toString(),
    contactValue: currentUser.contactValue,
    bio: currentUser.bio || ''
  });
  const [photos, setPhotos] = useState<string[]>(currentUser.photos || []);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false); // Separate loading state for photos
  const [success, setSuccess] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text Data Save (Manual)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess('');
    
    try {
      const updatedUser = await updateUserProfile(currentUser.id, {
        displayName: formData.displayName, // Update display name
        password: formData.password,
        age: parseInt(formData.age),
        contactValue: formData.contactValue,
        bio: formData.bio,
      });
      onUpdateUser(updatedUser);
      setSuccess('基本信息保存成功');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      // Error handled in backend
    } finally {
      setLoading(false);
    }
  };

  // Helper to persist photos immediately
  const savePhotosToBackend = async (newPhotoList: string[]) => {
    setPhotoLoading(true);
    try {
        const updatedUser = await updateUserProfile(currentUser.id, {
            photos: newPhotoList
        });
        // Only update UI state if backend save succeeded
        setPhotos(updatedUser.photos); 
        onUpdateUser(updatedUser);
        setSuccess('照片已自动保存');
        setTimeout(() => setSuccess(''), 2000);
    } catch (e) {
        console.error("Photo save failed", e);
    } finally {
        setPhotoLoading(false);
    }
  };

  // Real Image Upload with Aggressive Compression & Auto-Save
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
        alert("图片太大，请选择小于10MB的图片");
        return;
    }

    setPhotoLoading(true); // Start loading UI immediately

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG 0.6 quality
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        
        // TRIGGER AUTO SAVE
        const newPhotoList = [...photos, dataUrl];
        savePhotosToBackend(newPhotoList);
      };
    };
    
    e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    if(!confirm("确定要删除这张照片吗？")) return;
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    // TRIGGER AUTO SAVE
    savePhotosToBackend(newPhotos);
  };

  return (
    <div className="h-full flex flex-col items-center p-4 md:p-8 animate-in fade-in duration-500 overflow-y-auto custom-scrollbar pb-24 md:pb-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Column: Profile Overview Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-sm p-6 md:p-8 flex flex-col items-center relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            
            <div className="relative mb-6 mt-4 group">
              {photos.length > 0 ? (
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-2 border-white/20 overflow-hidden shadow-2xl relative z-10">
                   <img src={photos[0]} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br from-gray-800 to-black border-2 border-white/20 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-2xl relative z-10">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
              )}
              
              <div className="absolute bottom-1 right-1 bg-gold-500 text-black p-2 rounded-full border-4 border-[#0c0c0e] z-20" title="已验证会员">
                 <Shield size={14} fill="currentColor" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1 tracking-wide">{currentUser.displayName || currentUser.username}</h2>
            <p className="text-xs text-gray-500 mb-2">@{currentUser.username}</p>
            <div className="flex items-center gap-2 mb-8 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <Fingerprint size={12} className="text-gold-500" />
              <p className="text-gray-300 text-[10px] tracking-[0.1em] font-mono">UID: {currentUser.uid || '---'}</p>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mb-8">
               <div className="bg-white/5 p-3 md:p-4 rounded-sm text-center border border-white/5 hover:border-gold-500/30 transition-colors">
                  <Heart className="mx-auto text-gold-500 mb-2" size={18} />
                  <span className="text-white font-bold text-xl block">{currentUser.likes || 0}</span>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">获赞</p>
               </div>
               <div className="bg-white/5 p-3 md:p-4 rounded-sm text-center border border-white/5 hover:border-blue-500/30 transition-colors">
                  <Users className="mx-auto text-blue-400 mb-2" size={18} />
                  <span className="text-white font-bold text-xl block">{currentUser.friends?.length || 0}</span>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">好友</p>
               </div>
            </div>

            <div className="mt-auto w-full border-t border-white/10 pt-6">
              <div className="flex items-center gap-2 text-gray-500 text-xs justify-center">
                <Calendar size={12} />
                <span>加入于 {new Date(currentUser.registeredAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="md:col-span-2">
          <div className="bg-[#0c0c0e] border border-white/10 p-6 md:p-8 rounded-sm h-full flex flex-col relative">
             <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <div>
                 <h3 className="text-xl font-bold text-white brand-font flex items-center gap-2">
                   <Edit3 size={18} className="text-gold-500" /> 编辑资料
                 </h3>
                 <p className="text-gray-500 text-xs mt-1 tracking-wide">完善您的个人信息以获得更多关注</p>
               </div>
               
               {success && (
                <div className="w-full md:w-auto px-4 py-2 bg-green-500/10 text-green-400 text-xs border border-green-500/20 rounded-sm shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
                  <Shield size={12} /> {success}
                </div>
              )}
             </div>

            <div className="space-y-4">
              {/* Photos Section */}
              <div className="mb-8">
                 <div className="flex items-baseline gap-2 mb-3 pl-1">
                    <label className="text-gray-300 text-sm font-medium tracking-wide">照片墙</label>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-sans">GALLERY (自动保存)</span>
                 </div>
                 
                 <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                   {photos.map((photo, index) => (
                     <div key={index} className="relative aspect-square rounded-sm overflow-hidden group border border-white/10">
                       <img src={photo} alt="User upload" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <button type="button" onClick={() => handleRemovePhoto(index)} className="text-white hover:text-red-400 p-2" disabled={photoLoading}>
                           <Trash2 size={16} />
                         </button>
                       </div>
                     </div>
                   ))}
                   
                   {/* Hidden Input */}
                   <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/jpg"
                   />
                   
                   <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoLoading}
                    className="aspect-square border border-dashed border-white/20 rounded-sm flex flex-col items-center justify-center text-gray-500 hover:text-white hover:border-white/50 hover:bg-white/5 transition-all gap-1 relative overflow-hidden"
                   >
                     {photoLoading ? (
                        <Loader2 className="animate-spin text-gold-500" size={20} />
                     ) : (
                        <>
                            <Camera size={20} />
                            <span className="text-[9px]">上传照片</span>
                        </>
                     )}
                   </button>
                 </div>
                 <p className="text-[10px] text-gray-600 mt-2">* 照片上传后会自动保存。支持 JPG/PNG。</p>
              </div>

              {/* Text Form */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="mb-4">
                   <div className="text-gray-500 text-[10px] mb-1">登录账号 (不可修改)</div>
                   <div className="bg-white/5 border border-white/10 p-3 text-gray-400 text-sm rounded-sm">
                      {currentUser.username}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div>
                        <Input 
                            label="展示昵称"
                            labelEn="DISPLAY NAME" 
                            type="text" 
                            value={formData.displayName}
                            onChange={e => setFormData({...formData, displayName: e.target.value})}
                            className="!bg-black/40 !border-white/10 focus:!border-white/30"
                        />
                    </div>
                    <div>
                        <Input 
                            label="登录密码"
                            labelEn="PASSWORD" 
                            type="text" 
                            value={formData.password}
                            onChange={e => setFormData({...formData, password: e.target.value})}
                            className="!bg-black/40 !border-white/10 focus:!border-white/30"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div>
                        <Input 
                            label="年龄"
                            labelEn="AGE"
                            type="number"
                            value={formData.age}
                            onChange={e => setFormData({...formData, age: e.target.value})}
                            className="!bg-black/40 !border-white/10 focus:!border-white/30"
                        />
                    </div>
                    <div>
                        <Input 
                        label={`联系方式 (${currentUser.contactType})`}
                        labelEn="CONTACT INFO"
                        value={formData.contactValue}
                        onChange={e => setFormData({...formData, contactValue: e.target.value})}
                        className="!bg-black/40 !border-white/10 focus:!border-white/30"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex justify-between items-end mb-3 pl-1">
                        <div className="flex items-baseline gap-2">
                        <label className="text-gray-300 text-sm font-medium tracking-wide">个性签名</label>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-sans">BIO</span>
                        </div>
                        <span className="text-[10px] text-gray-600 font-mono">{formData.bio.length}/100</span>
                    </div>
                    <textarea 
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    maxLength={100}
                    className="w-full h-24 bg-black/40 border border-white/10 rounded-sm p-4 text-white text-sm focus:outline-none focus:border-gold-500/30 focus:bg-white/5 resize-none transition-all placeholder-gray-700 leading-relaxed"
                    placeholder="写两句介绍一下你自己，让更多人认识你..."
                    />
                </div>

                <div className="pt-8 flex justify-end mt-auto">
                    <button
                    type="submit"
                    disabled={loading}
                    className="w-full md:w-auto bg-white text-black font-bold py-3 px-8 rounded-sm hover:bg-gold-400 transition-all flex items-center justify-center gap-2 text-sm tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] group"
                    >
                    {loading ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} className="group-hover:scale-110 transition-transform" /> 保存文本信息</>}
                    </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};