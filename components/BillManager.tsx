
import React, { useState } from 'react';
import { Plus, Trash2, Edit, X, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Bill, Role } from '../types';

interface BillManagerProps {
    role: Role;
}

const BillManager: React.FC<BillManagerProps> = ({ role }) => {
  const [bills, setBills] = useState<Bill[]>(dormService.getBills());
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const rooms = dormService.getRooms();
  
  const [formData, setFormData] = useState({
      roomId: '',
      month: new Date().toISOString().slice(0, 7), // YYYY-MM
      electricIndexOld: 0,
      electricIndexNew: 0,
      waterIndexOld: 0,
      waterIndexNew: 0,
      roomFee: 0
  });

  const handleRoomSelect = (roomId: string) => {
      const room = rooms.find(r => r.id === roomId);
      setFormData({
          ...formData, 
          roomId,
          roomFee: room ? room.pricePerMonth : 0
      });
  };

  const handleEdit = (bill: Bill, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(bill.id);
      setFormData({
          roomId: bill.roomId,
          month: bill.month,
          electricIndexOld: bill.electricIndexOld,
          electricIndexNew: bill.electricIndexNew,
          waterIndexOld: bill.waterIndexOld,
          waterIndexNew: bill.waterIndexNew,
          roomFee: bill.roomFee
      });
      setShowModal(true);
  };

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({
          roomId: '',
          month: new Date().toISOString().slice(0, 7),
          electricIndexOld: 0,
          electricIndexNew: 0,
          waterIndexOld: 0,
          waterIndexNew: 0,
          roomFee: 0
      });
      setShowModal(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingId) {
          dormService.updateBill(editingId, formData);
      } else {
          dormService.createBill(formData);
      }
      setBills(dormService.getBills());
      setShowModal(false);
      setEditingId(null);
  };

  const handlePay = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      if(window.confirm("Xác nhận đã thu tiền đầy đủ và thanh toán hóa đơn này?")) {
        dormService.payBill(id);
        setBills(dormService.getBills());
      }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if(window.confirm("Bạn có chắc muốn xóa hóa đơn này?")) {
          dormService.deleteBill(id);
          setBills(dormService.getBills());
      }
  };

  const isOverdue = (bill: Bill) => {
      if (bill.status === 'PAID') return false;
      const today = new Date();
      const due = new Date(bill.dueDate);
      return today > due;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Hóa đơn & Điện nước</h2>
        {role === Role.ADMIN && (
            <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
            <Plus size={18} />
            Tạo Hóa Đơn
            </button>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {bills.map(bill => {
              const roomName = rooms.find(r => r.id === bill.roomId)?.name || bill.roomId;
              const overdue = isOverdue(bill);

              return (
                  <div key={bill.id} className={`bg-white p-6 rounded-xl shadow-sm border relative overflow-hidden group hover:shadow-md transition-all ${overdue ? 'border-red-300 ring-1 ring-red-100' : 'border-gray-200'}`}>
                      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 pointer-events-none ${bill.status === 'PAID' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      
                      {role === Role.ADMIN && (
                          <div className="absolute top-2 right-2 z-10 flex gap-1">
                              <button 
                                  type="button"
                                  onClick={(e) => handleEdit(bill, e)} 
                                  className="text-gray-400 hover:text-indigo-600 p-2 bg-white/80 rounded-full shadow-sm border border-gray-100 hover:border-indigo-200 transition-all pointer-events-auto"
                                  title="Sửa hóa đơn"
                              >
                                  <Edit size={16} className="pointer-events-none"/>
                              </button>
                              <button 
                                  type="button"
                                  onClick={(e) => handleDelete(bill.id, e)} 
                                  className="text-gray-400 hover:text-red-600 p-2 bg-white/80 rounded-full shadow-sm border border-gray-100 hover:border-red-200 transition-all pointer-events-auto"
                                  title="Xóa hóa đơn"
                              >
                                  <Trash2 size={16} className="pointer-events-none"/>
                              </button>
                          </div>
                      )}

                      <div className="flex justify-between items-start mb-2">
                          <div>
                              <h3 className="text-lg font-bold text-gray-900">Phòng {roomName}</h3>
                              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                                  <Calendar size={14}/> Tháng: {bill.month}
                              </div>
                          </div>
                          <span className={`px-2 py-1 text-xs font-bold rounded ${bill.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {bill.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                          </span>
                      </div>
                      
                      {bill.status === 'UNPAID' && (
                        <div className={`text-xs font-medium mb-3 flex items-center gap-1 ${overdue ? 'text-red-600' : 'text-orange-600'}`}>
                            <AlertTriangle size={12}/> Hạn đóng: {bill.dueDate} {overdue && '(Quá hạn)'}
                        </div>
                      )}

                      <div className="space-y-2 text-sm border-t border-b border-gray-100 py-3 my-2">
                          <div className="flex justify-between">
                              <span className="text-gray-600">Điện ({bill.electricIndexNew - bill.electricIndexOld} kWh)</span>
                              <span className="font-medium">{(bill.electricIndexNew - bill.electricIndexOld) * 3500} đ</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-600">Nước ({bill.waterIndexNew - bill.waterIndexOld} m3)</span>
                              <span className="font-medium">{(bill.waterIndexNew - bill.waterIndexOld) * 10000} đ</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-600">Tiền phòng</span>
                              <span className="font-medium">{bill.roomFee.toLocaleString()} đ</span>
                          </div>
                      </div>

                      <div className="flex flex-col gap-3 pt-1">
                          <div className="flex justify-between items-end">
                             <span className="text-gray-500 text-xs">Tổng cộng</span>
                             <span className="text-xl font-bold text-indigo-700">{bill.totalAmount.toLocaleString()} đ</span>
                          </div>
                          
                          {bill.status === 'UNPAID' && (
                              <button 
                                onClick={(e) => handlePay(e, bill.id)} 
                                className="w-full py-2 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg hover:bg-indigo-100 flex items-center justify-center gap-2 transition-colors"
                              >
                                  <CheckCircle size={16}/> Xác nhận thu tiền
                              </button>
                          )}
                      </div>
                  </div>
              );
          })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in">
                <div className="flex justify-between mb-4">
                    <h3 className="text-xl font-bold">{editingId ? 'Cập nhật Hóa Đơn' : 'Lập Hóa Đơn Mới'}</h3>
                    <button onClick={() => setShowModal(false)}><X className="text-gray-400"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <select required value={formData.roomId} onChange={e => handleRoomSelect(e.target.value)} className="p-2 border rounded-lg w-full bg-white">
                            <option value="">Chọn Phòng</option>
                            {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <input type="month" required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="p-2 border rounded-lg w-full" />
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase">Chỉ số Điện</p>
                        <div className="flex gap-3">
                            <div className="w-full">
                                <label className="text-[10px] text-gray-400">Số cũ</label>
                                <input type="number" placeholder="Số cũ" required value={formData.electricIndexOld} onChange={e => setFormData({...formData, electricIndexOld: Number(e.target.value)})} className="p-2 border rounded w-full" />
                            </div>
                            <div className="w-full">
                                <label className="text-[10px] text-gray-400">Số mới</label>
                                <input type="number" placeholder="Số mới" required value={formData.electricIndexNew} onChange={e => setFormData({...formData, electricIndexNew: Number(e.target.value)})} className="p-2 border rounded w-full" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg space-y-3">
                        <p className="text-xs font-bold text-gray-500 uppercase">Chỉ số Nước</p>
                        <div className="flex gap-3">
                            <div className="w-full">
                                <label className="text-[10px] text-gray-400">Số cũ</label>
                                <input type="number" placeholder="Số cũ" required value={formData.waterIndexOld} onChange={e => setFormData({...formData, waterIndexOld: Number(e.target.value)})} className="p-2 border rounded w-full" />
                            </div>
                            <div className="w-full">
                                <label className="text-[10px] text-gray-400">Số mới</label>
                                <input type="number" placeholder="Số mới" required value={formData.waterIndexNew} onChange={e => setFormData({...formData, waterIndexNew: Number(e.target.value)})} className="p-2 border rounded w-full" />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                         <label className="text-xs text-gray-500">Tiền phòng (VNĐ)</label>
                         <input type="number" required value={formData.roomFee} onChange={e => setFormData({...formData, roomFee: Number(e.target.value)})} className="p-2 border rounded w-full" />
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 mt-2">
                        {editingId ? 'Lưu thay đổi' : 'Tạo Hóa Đơn'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default BillManager;
