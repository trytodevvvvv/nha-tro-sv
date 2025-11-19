
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
        const res = dormService.payBill(id);
        if (res.success) {
            setBills([...dormService.getBills()]); // Force refresh
            alert(res.message);
        }
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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hóa đơn & Điện nước</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Quản lý thu chi hàng tháng.</p>
        </div>
        {role === Role.ADMIN && (
            <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
            <Plus size={18} />
            <span className="hidden sm:inline">Tạo Hóa Đơn</span>
            </button>
        )}
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {bills.map(bill => {
              const roomName = rooms.find(r => r.id === bill.roomId)?.name || bill.roomId;
              const overdue = isOverdue(bill);

              return (
                  <div key={bill.id} className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${overdue ? 'border-red-300 ring-1 ring-red-100 dark:border-red-800 dark:ring-red-900/50' : 'border-gray-200 dark:border-gray-700'}`}>
                      {/* Background Decoration */}
                      <div className={`absolute top-0 right-0 w-32 h-32 -mr-10 -mt-10 rounded-full opacity-10 pointer-events-none transition-transform group-hover:scale-110 ${bill.status === 'PAID' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      
                      {role === Role.ADMIN && (
                          <div className="absolute top-3 right-3 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button 
                                  type="button"
                                  onClick={(e) => handleEdit(bill, e)} 
                                  className="text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-100 dark:border-gray-600 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all"
                                  title="Sửa hóa đơn"
                              >
                                  <Edit size={14} className="pointer-events-none"/>
                              </button>
                              <button 
                                  type="button"
                                  onClick={(e) => handleDelete(bill.id, e)} 
                                  className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm border border-gray-100 dark:border-gray-600 hover:border-red-200 dark:hover:border-red-500 transition-all"
                                  title="Xóa hóa đơn"
                              >
                                  <Trash2 size={14} className="pointer-events-none"/>
                              </button>
                          </div>
                      )}

                      <div className="flex justify-between items-start mb-3 relative z-10">
                          <div>
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Phòng {roomName}</h3>
                              <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  <Calendar size={14}/> <span className="font-medium">Tháng {bill.month}</span>
                              </div>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wide ${bill.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                              {bill.status === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                          </span>
                      </div>
                      
                      {bill.status === 'UNPAID' && (
                        <div className={`text-xs font-medium mb-4 flex items-center gap-1.5 ${overdue ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                            <AlertTriangle size={14}/> 
                            <span>Hạn đóng: {bill.dueDate} {overdue && '(Quá hạn)'}</span>
                        </div>
                      )}

                      <div className="space-y-2 text-sm border-t border-b border-gray-100 dark:border-gray-700 py-4 my-2 relative z-10">
                          <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Điện ({bill.electricIndexNew - bill.electricIndexOld} kWh)</span>
                              <span className="font-medium text-gray-900 dark:text-gray-200">{(bill.electricIndexNew - bill.electricIndexOld) * 3500} đ</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Nước ({bill.waterIndexNew - bill.waterIndexOld} m3)</span>
                              <span className="font-medium text-gray-900 dark:text-gray-200">{(bill.waterIndexNew - bill.waterIndexOld) * 10000} đ</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Tiền phòng</span>
                              <span className="font-medium text-gray-900 dark:text-gray-200">{bill.roomFee.toLocaleString()} đ</span>
                          </div>
                      </div>

                      <div className="flex flex-col gap-4 pt-2 relative z-10">
                          <div className="flex justify-between items-end">
                             <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">Tổng cộng</span>
                             <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">{bill.totalAmount.toLocaleString()} đ</span>
                          </div>
                          
                          {bill.status === 'UNPAID' && (
                              <button 
                                onClick={(e) => handlePay(e, bill.id)} 
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:transform active:scale-95"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4 transition-opacity duration-300">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-fade-in border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Cập nhật Hóa Đơn' : 'Lập Hóa Đơn Mới'}</h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Chọn Phòng</label>
                             <select required value={formData.roomId} onChange={e => handleRoomSelect(e.target.value)} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="">-- Chọn --</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                             <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tháng</label>
                             <input type="month" required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Chỉ số Điện</p>
                        <div className="flex gap-3">
                            <div className="w-full">
                                <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Số cũ</label>
                                <input type="number" placeholder="0" required value={formData.electricIndexOld} onChange={e => setFormData({...formData, electricIndexOld: Number(e.target.value)})} className="p-2 border border-gray-200 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div className="w-full">
                                <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Số mới</label>
                                <input type="number" placeholder="0" required value={formData.electricIndexNew} onChange={e => setFormData({...formData, electricIndexNew: Number(e.target.value)})} className="p-2 border border-gray-200 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl space-y-3 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500"></div> Chỉ số Nước</p>
                        <div className="flex gap-3">
                            <div className="w-full">
                                <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Số cũ</label>
                                <input type="number" placeholder="0" required value={formData.waterIndexOld} onChange={e => setFormData({...formData, waterIndexOld: Number(e.target.value)})} className="p-2 border border-gray-200 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                            </div>
                            <div className="w-full">
                                <label className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold">Số mới</label>
                                <input type="number" placeholder="0" required value={formData.waterIndexNew} onChange={e => setFormData({...formData, waterIndexNew: Number(e.target.value)})} className="p-2 border border-gray-200 dark:border-gray-600 rounded w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm" />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                         <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Tiền phòng (VNĐ)</label>
                         <input type="number" required value={formData.roomFee} onChange={e => setFormData({...formData, roomFee: Number(e.target.value)})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
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
