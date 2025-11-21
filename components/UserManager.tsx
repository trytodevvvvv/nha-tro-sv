import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { dormService } from '../services/dormService';
import { Plus, User as UserIcon, Trash2, Shield, Edit, X, Key } from 'lucide-react';

interface UserManagerProps {
    currentUser: User;
}

const UserManager: React.FC<UserManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
      username: '',
      password: '',
      fullName: '',
      role: Role.STAFF
  });

  const fetchData = async () => {
      try {
        const u = await dormService.getUsers();
        setUsers(u);
      } catch (error) {
          console.error("Failed to fetch users", error);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  if (currentUser.role !== Role.ADMIN) {
      return <div className="p-8 text-center text-red-500">Bạn không có quyền truy cập trang này.</div>;
  }

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({ username: '', password: '', fullName: '', role: Role.STAFF });
      setShowModal(true);
  };

  const handleEdit = (u: User, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(u.id);
      setFormData({
          username: u.username,
          password: u.password || '', 
          fullName: u.fullName,
          role: u.role
      });
      setShowModal(true);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (id === currentUser.id) {
          alert("Bạn không thể tự xóa tài khoản của chính mình!");
          return;
      }
      if (window.confirm("Bạn có chắc muốn xóa tài khoản này?")) {
          await dormService.deleteUser(id);
          fetchData();
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      let res;
      if (editingId) {
          res = await dormService.updateUser(editingId, formData);
      } else {
          res = await dormService.addUser(formData);
      }

      if (res.success !== false) {
          fetchData();
          setShowModal(false);
      } else {
          alert(res.message || "Lỗi không xác định");
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h2>
            <p className="text-sm text-gray-500">Phân quyền và quản lý nhân viên hệ thống.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Thêm Tài khoản
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Tên đăng nhập</th>
                    <th className="p-4">Vai trò</th>
                    <th className="p-4 text-right">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'}`}>
                                {u.role === Role.ADMIN ? <Shield size={16}/> : <UserIcon size={16}/>}
                            </div>
                            {u.fullName}
                            {u.id === currentUser.id && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full ml-2">Bạn</span>}
                        </td>
                        <td className="p-4 text-gray-600 font-mono">{u.username}</td>
                        <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                                {u.role === Role.ADMIN ? 'Quản trị viên' : 'Nhân viên'}
                            </span>
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={(e) => handleEdit(u, e)} 
                                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    title="Sửa"
                                >
                                    <Edit size={18}/>
                                </button>
                                <button 
                                    type="button"
                                    onClick={(e) => handleDelete(u.id, e)} 
                                    disabled={u.id === currentUser.id}
                                    className={`p-2 rounded transition-colors ${u.id === currentUser.id ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                    title="Xóa"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                  <div className="flex justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Cập nhật Tài khoản' : 'Thêm Nhân viên mới'}</h3>
                      <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">Họ và tên</label>
                          <div className="relative">
                              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                              <input required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nguyễn Văn A" />
                          </div>
                      </div>
                      
                      <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">Tên đăng nhập</label>
                          <input required disabled={!!editingId} value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-gray-100" />
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">Mật khẩu</label>
                          <div className="relative">
                              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                              <input required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" type="text" />
                          </div>
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-700">Phân quyền</label>
                          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})} className="w-full p-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none">
                              <option value={Role.STAFF}>Nhân viên (Giới hạn quyền)</option>
                              <option value={Role.ADMIN}>Quản trị viên (Toàn quyền)</option>
                          </select>
                      </div>

                      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 mt-4">
                          {editingId ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserManager;