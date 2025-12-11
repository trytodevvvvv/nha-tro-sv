
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, Role } from '../types';
import { dormService } from '../services/dormService';
import { Plus, User as UserIcon, Trash2, Shield, Edit, X, Key, Crown, Search } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

interface UserManagerProps { currentUser: User; }

const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  const { showToast } = useToast();
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; userId: string | null; }>({ isOpen: false, userId: null });
  const [formData, setFormData] = useState({ username: '', password: '', fullName: '', role: Role.STAFF });

  const fetchData = async () => {
      try { const u = await dormService.getUsers(); setUsers(u); } catch (error) {}
  };
  useEffect(() => { fetchData(); }, []);

  if (currentUser.role !== Role.ADMIN) return <div className="p-8 text-center text-red-500 font-bold bg-white/50 backdrop-blur-md rounded-2xl">Restricted Access</div>;

  const handleAddNew = () => { setEditingId(null); setFormData({ username: '', password: '', fullName: '', role: Role.STAFF }); setShowModal(true); };
  const handleEdit = (u: User) => { setEditingId(u.id); setFormData({ username: u.username, password: u.password || '', fullName: u.fullName, role: u.role }); setShowModal(true); };
  
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingId) await dormService.updateUser(editingId, formData);
      else await dormService.addUser(formData);
      showToast('Thành công', 'success'); fetchData(); setShowModal(false);
  };
  
  const confirmDelete = async () => {
      if (confirmModal.userId) {
          await dormService.deleteUser(confirmModal.userId);
          setUsers(prev => prev.filter(u => u.id !== confirmModal.userId));
          showToast('Đã xóa', 'success');
      }
      setConfirmModal({isOpen: false, userId: null});
  }

  // Filter Logic
  const filteredUsers = users.filter(u => 
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-[1200px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Hệ thống</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Quản lý người dùng & phân quyền.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                    <input 
                        placeholder="Tìm người dùng..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                    />
            </div>
            <button onClick={handleAddNew} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap">
            <Plus size={20} /> Tài khoản
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredUsers.length > 0 ? (
              filteredUsers.map(u => (
                  <div key={u.id} className="group bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/40 dark:border-gray-700/50 shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all flex items-center gap-6 relative overflow-hidden">
                      {u.role === Role.ADMIN && <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>}
                      
                      <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center text-white shadow-lg ${u.role === Role.ADMIN ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                            {u.role === Role.ADMIN ? <Crown size={28}/> : <UserIcon size={28}/>}
                      </div>

                      <div className="flex-1">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white">{u.fullName}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-2">@{u.username}</p>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                {u.role}
                            </span>
                      </div>

                      <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(u)} className="p-3 bg-white dark:bg-gray-700 text-indigo-500 rounded-2xl shadow-sm hover:scale-110 transition-transform"><Edit size={18}/></button>
                            {u.id !== currentUser.id && <button onClick={() => setConfirmModal({isOpen: true, userId: u.id})} className="p-3 bg-white dark:bg-gray-700 text-red-500 rounded-2xl shadow-sm hover:scale-110 transition-transform"><Trash2 size={18}/></button>}
                      </div>
                  </div>
              ))
          ) : (
              <div className="col-span-full py-10 text-center text-gray-400 italic">Không tìm thấy tài khoản nào.</div>
          )}
      </div>

      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmDelete} title="Xóa Tài Khoản" message="Không thể hoàn tác." type="danger" />

      {showModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-lg animate-fade-in">
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-scale-in border border-white/20">
                  <h3 className="text-2xl font-black mb-6 dark:text-white">{editingId ? 'Cập nhật' : 'Thêm'} User</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <input required placeholder="Họ tên" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold" />
                      <input required disabled={!!editingId} placeholder="Username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold disabled:opacity-50" />
                      <input required placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold" />
                      <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold">
                          <option value={Role.STAFF}>Nhân viên</option>
                          <option value={Role.ADMIN}>Admin</option>
                      </select>
                      <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">Lưu</button>
                      <button type="button" onClick={() => setShowModal(false)} className="w-full py-4 bg-transparent text-gray-500 font-bold">Hủy</button>
                  </form>
              </div>
          </div>, document.body
      )}
    </div>
  );
};

export default UserManager;
