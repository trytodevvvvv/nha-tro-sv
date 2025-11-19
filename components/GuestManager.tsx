
import React, { useState } from 'react';
import { Plus, Search, Trash2, User, Calendar, CreditCard, X, Edit } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Guest, Role } from '../types';

interface GuestManagerProps {
  onUpdate: () => void;
  role: Role;
}

const GuestManager: React.FC<GuestManagerProps> = ({ onUpdate, role }) => {
  const [guests, setGuests] = useState<Guest[]>(dormService.getGuests());
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    cccd: '',
    relation: '',
    roomId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: ''
  });

  const rooms = dormService.getRooms();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEdit = (guest: Guest, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(guest.id);
      setFormData({
          name: guest.name,
          cccd: guest.cccd,
          relation: guest.relation,
          roomId: guest.roomId,
          checkInDate: guest.checkInDate,
          checkOutDate: guest.checkOutDate
      });
      setShowModal(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation(); // Prevent event bubbling
     if(window.confirm("Xác nhận khách đã rời đi và xóa khỏi danh sách?")) {
         dormService.checkOutGuest(id);
         setGuests([...dormService.getGuests()]); // Force re-render
         onUpdate();
     }
  };

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({ name: '', cccd: '', relation: '', roomId: '', checkInDate: new Date().toISOString().split('T')[0], checkOutDate: '' });
      setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if(!formData.checkOutDate) {
        setErrorMsg("Vui lòng chọn ngày rời đi");
        return;
    }

    try {
      let result;
      if (editingId) {
          result = dormService.updateGuest(editingId, formData);
      } else {
          result = dormService.checkInGuest({
            name: formData.name,
            cccd: formData.cccd,
            relation: formData.relation,
            roomId: formData.roomId,
            checkInDate: formData.checkInDate,
            checkOutDate: formData.checkOutDate
          });
      }

      if (result.success) {
        setGuests([...dormService.getGuests()]);
        setShowModal(false);
        setFormData({ name: '', cccd: '', relation: '', roomId: '', checkInDate: new Date().toISOString().split('T')[0], checkOutDate: '' });
        setEditingId(null);
        onUpdate(); 
      } else {
        setErrorMsg(result.message);
      }
    } catch (err) {
      setErrorMsg("Đã xảy ra lỗi.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Khách</h2>
          <p className="text-gray-500 text-sm mt-1">Theo dõi người nhà và khách thăm.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          Đăng ký Khách
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
             <input 
                type="text" 
                placeholder="Tìm theo tên hoặc CCCD..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
             />
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Họ tên</th>
                <th className="p-4 font-medium">CCCD</th>
                <th className="p-4 font-medium">Phòng</th>
                <th className="p-4 font-medium">Quan hệ</th>
                <th className="p-4 font-medium">Thời gian</th>
                <th className="p-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {guests.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">Hiện không có khách lưu trú.</td>
                 </tr>
              ) : (
                guests.map(guest => (
                  <tr key={guest.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                        <User size={16} />
                      </div>
                      {guest.name}
                    </td>
                    <td className="p-4 text-gray-500">{guest.cccd}</td>
                    <td className="p-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-medium">
                            Phòng {rooms.find(r => r.id === guest.roomId)?.name || guest.roomId}
                        </span>
                    </td>
                    <td className="p-4 text-gray-500">{guest.relation}</td>
                    <td className="p-4 text-gray-500">
                        <div className="flex flex-col text-xs">
                            <span>Vào: {guest.checkInDate}</span>
                            <span>Ra: {guest.checkOutDate}</span>
                        </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                          <button 
                            type="button"
                            onClick={(e) => handleEdit(guest, e)} 
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors hover:bg-indigo-50 rounded" 
                            title="Sửa thông tin"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => handleDelete(guest.id, e)} 
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded" 
                            title="Check-out"
                          >
                            <Trash2 size={18} />
                          </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl transform transition-all">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Cập nhật thông tin' : 'Đăng ký Khách ở lại'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Họ tên khách</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            placeholder="Nguyễn Văn A"
                        />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">CCCD / CMND</label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            name="cccd"
                            required
                            value={formData.cccd}
                            onChange={handleInputChange}
                            className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                            placeholder="00109..."
                        />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Chọn Phòng</label>
                    <select 
                        name="roomId"
                        required
                        value={formData.roomId}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                        <option value="">-- Chọn Phòng --</option>
                        {rooms.map(r => (
                            <option key={r.id} value={r.id} disabled={r.currentCapacity >= r.maxCapacity && r.id !== (editingId ? guests.find(g => g.id === editingId)?.roomId : '')}>
                                {r.name} (Hiện tại: {r.currentCapacity}/{r.maxCapacity})
                            </option>
                        ))}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Quan hệ với chủ phòng</label>
                    <input 
                        name="relation"
                        required
                        value={formData.relation}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        placeholder="vd: Em trai"
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Ngày đến</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="date"
                            name="checkInDate"
                            required
                            value={formData.checkInDate}
                            onChange={handleInputChange}
                            className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                    </div>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-700">Ngày đi dự kiến</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="date"
                            name="checkOutDate"
                            required
                            value={formData.checkOutDate}
                            onChange={handleInputChange}
                            className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                    </div>
                 </div>
              </div>

              <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                  >
                    {editingId ? 'Lưu thay đổi' : 'Xác nhận'}
                  </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestManager;
