import React, { useState } from 'react';
import { Plus, Search, Trash2, User, MapPin, GraduationCap, X, Edit } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Student, Role } from '../types';

interface StudentManagerProps {
  onUpdate: () => void;
  role: Role;
}

const StudentManager: React.FC<StudentManagerProps> = ({ onUpdate, role }) => {
  const [students, setStudents] = useState<Student[]>(dormService.getStudents());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const rooms = dormService.getRooms();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    gender: 'Male',
    phone: '',
    roomId: '',
    university: ''
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Ngăn chặn click lan ra dòng
      if(window.confirm("Bạn có chắc muốn xóa sinh viên này không?")) {
          dormService.deleteStudent(id);
          setStudents([...dormService.getStudents()]); // Spread array để force re-render
          onUpdate();
      }
  };

  const handleEdit = (s: Student, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(s.id);
      setFormData({
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
      setFormData({ name: '', dob: '', gender: 'Male', phone: '', roomId: '', university: '' });
      setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    
    if (editingId) {
        result = dormService.updateStudent(editingId, {
             name: formData.name,
             dob: formData.dob,
             gender: formData.gender as 'Male'|'Female',
             phone: formData.phone,
             roomId: formData.roomId,
             university: formData.university
        });
    } else {
        result = dormService.addStudent({
            name: formData.name,
            dob: formData.dob,
            gender: formData.gender as 'Male'|'Female',
            phone: formData.phone,
            roomId: formData.roomId,
            university: formData.university
        });
    }

    if (result.success) {
        setStudents([...dormService.getStudents()]);
        setShowModal(false);
        setEditingId(null);
        onUpdate();
    } else {
        alert(result.message);
    }
  };

  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Sinh viên</h2>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Thêm Sinh viên
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input type="text" placeholder="Tìm kiếm sinh viên..." className="w-full pl-10 p-2 border border-gray-200 rounded-lg outline-none focus:border-indigo-500" />
            </div>
        </div>
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                    <th className="p-4">Họ và tên</th>
                    <th className="p-4">Phòng</th>
                    <th className="p-4">Trường / ĐH</th>
                    <th className="p-4">SĐT</th>
                    <th className="p-4 text-right">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {students.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                <User size={16} />
                            </div>
                            <div>
                                <div className="text-gray-900">{s.name}</div>
                                <div className="text-xs text-gray-500">{s.gender === 'Male' ? 'Nam' : 'Nữ'} • {s.dob}</div>
                            </div>
                        </td>
                        <td className="p-4">
                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-1 rounded w-fit">
                                <MapPin size={12} /> {getRoomName(s.roomId)}
                            </span>
                        </td>
                        <td className="p-4 text-gray-600"><GraduationCap size={14} className="inline mr-1"/>{s.university}</td>
                        <td className="p-4 text-gray-600">{s.phone}</td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button 
                                    type="button"
                                    onClick={(e) => handleEdit(s, e)} 
                                    className="text-gray-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                                >
                                    <Edit size={18} />
                                </button>
                                {role === Role.ADMIN && (
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDelete(s.id, e)} 
                                        className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
                  <div className="flex justify-between mb-4">
                      <h3 className="text-xl font-bold">{editingId ? 'Cập nhật thông tin' : 'Thêm Sinh viên mới'}</h3>
                      <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Họ và tên" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="p-2 border rounded-lg w-full" />
                        <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="p-2 border rounded-lg w-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="p-2 border rounded-lg w-full bg-white">
                              <option value="Male">Nam</option>
                              <option value="Female">Nữ</option>
                          </select>
                          <input required placeholder="Số điện thoại" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="p-2 border rounded-lg w-full" />
                      </div>
                      <input placeholder="Trường Đại học / Cao đẳng" value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} className="p-2 border rounded-lg w-full" />
                      
                      <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className="p-2 border rounded-lg w-full bg-white">
                          <option value="">-- Chọn phòng --</option>
                          {rooms.map(r => (
                              <option key={r.id} value={r.id} disabled={r.currentCapacity >= r.maxCapacity && r.id !== (editingId ? students.find(s=>s.id===editingId)?.roomId : '')}>
                                  {r.name} (Trống: {r.maxCapacity - r.currentCapacity})
                              </option>
                          ))}
                      </select>

                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 mt-2">
                          {editingId ? 'Lưu thay đổi' : 'Thêm sinh viên'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentManager;