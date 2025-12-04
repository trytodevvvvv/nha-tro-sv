
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Trash2, User, MapPin, GraduationCap, X, Edit, Hash } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Student, Role, Room } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface StudentManagerProps {
  onUpdate: () => void;
  role: Role;
}

const StudentManager: React.FC<StudentManagerProps> = ({ onUpdate, role }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  // Only show initial loading if no data exists at all
  const [loading, setLoading] = useState(true);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    studentId: string | null;
  }>({ isOpen: false, studentId: null });

  const fetchData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
          const [s, r] = await Promise.all([dormService.getStudents(), dormService.getRooms()]);
          setStudents(s);
          setRooms(r);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  // Background update when parent signals
  useEffect(() => { fetchData(true); }, [onUpdate]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    studentCode: '',
    name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    roomId: '',
    university: ''
  });

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setConfirmModal({ isOpen: true, studentId: id });
  };

  const confirmDelete = async () => {
      if (confirmModal.studentId) {
          const result = await dormService.deleteStudent(confirmModal.studentId);
          if (result.success) {
             fetchData(true); // Background refresh
             onUpdate();
          } else {
             alert(result.message || "Xóa thất bại");
          }
      }
      setConfirmModal({ isOpen: false, studentId: null });
  };

  const handleEdit = (s: Student, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(s.id);
      setFormData({
          studentCode: s.studentCode || '',
          name: s.name,
          dob: s.dob,
          gender: s.gender,
          phone: s.phone,
          roomId: s.roomId,
          university: s.university || ''
      });
      setShowModal(true);
  };

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({ studentCode: '', name: '', dob: '', gender: 'Male', phone: '', roomId: '', university: '' });
      setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    
    if (editingId) {
        result = await dormService.updateStudent(editingId, {
             studentCode: formData.studentCode,
             name: formData.name,
             dob: formData.dob,
             gender: formData.gender as 'Male'|'Female',
             phone: formData.phone,
             roomId: formData.roomId,
             university: formData.university
        });
    } else {
        result = await dormService.addStudent({
            studentCode: formData.studentCode,
            name: formData.name,
            dob: formData.dob,
            gender: formData.gender as 'Male'|'Female',
            phone: formData.phone,
            roomId: formData.roomId,
            university: formData.university
        });
    }

    if (result.success !== false) {
        fetchData(true); // Refresh in background
        setShowModal(false);
        setEditingId(null);
        onUpdate();
    } else {
        alert(result.message || "Thao tác thất bại");
    }
  };

  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || id;

  if (loading && students.length === 0) return <div className="p-10 text-center">Đang tải...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý Sinh viên</h2>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Thêm Sinh viên
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase tracking-wider">
                    <th className="p-4">MSV</th>
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Phòng</th>
                    <th className="p-4">Trường / ĐH</th>
                    <th className="p-4">SĐT</th>
                    <th className="p-4 text-right">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                {students.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                         <td className="p-4 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{s.studentCode}</td>
                        <td className="p-4 font-medium flex items-center gap-3 text-gray-900 dark:text-white">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                                <User size={16} />
                            </div>
                            <div>
                                <div>{s.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{s.gender === 'Male' ? 'Nam' : 'Nữ'} • {s.dob}</div>
                            </div>
                        </td>
                        <td className="p-4">
                            <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded w-fit text-xs font-medium">
                                <MapPin size={12} /> {getRoomName(s.roomId)}
                            </span>
                        </td>
                        <td className="p-4 text-gray-600 dark:text-gray-300"><GraduationCap size={14} className="inline mr-1"/>{s.university}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-300">{s.phone}</td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={(e) => handleEdit(s, e)} 
                                    className="text-gray-400 hover:text-indigo-600 p-1.5 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                                >
                                    <Edit size={16} />
                                </button>
                                {role === Role.ADMIN && (
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDeleteClick(s.id, e)} 
                                        className="text-gray-400 hover:text-red-600 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Xóa Sinh viên"
        message="Bạn có chắc chắn muốn xóa sinh viên này khỏi hệ thống? Hành động này không thể hoàn tác và sẽ cập nhật lại sĩ số phòng."
        confirmText="Xóa Sinh viên"
        type="danger"
      />

      {showModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100 dark:border-gray-700 animate-scale-in">
                  <div className="flex justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Cập nhật thông tin' : 'Thêm Sinh viên mới'}</h3>
                      <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input required placeholder="Mã Sinh viên (MSV)" value={formData.studentCode} onChange={e => setFormData({...formData, studentCode: e.target.value})} className="pl-9 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                         <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input required placeholder="Họ và tên" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="pl-9 p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                         <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                              <option value="Male">Nam</option>
                              <option value="Female">Nữ</option>
                          </select>
                      </div>
                      <input required placeholder="Số điện thoại" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                      <input placeholder="Trường Đại học / Cao đẳng" value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                      
                      <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                          <option value="">-- Chọn phòng --</option>
                          {rooms.map(r => (
                              <option key={r.id} value={r.id} disabled={r.currentCapacity >= r.maxCapacity && r.id !== (editingId ? students.find(s=>s.id===editingId)?.roomId : '')}>
                                  {r.name} (Trống: {r.maxCapacity - r.currentCapacity})
                              </option>
                          ))}
                      </select>

                      <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors mt-2">
                          {editingId ? 'Lưu thay đổi' : 'Thêm sinh viên'}
                      </button>
                  </form>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default StudentManager;
