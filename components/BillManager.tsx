
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Edit, X, Calendar, CheckCircle, AlertTriangle, DollarSign, Droplets, Zap, Home, Filter, RefreshCcw, Lock, Search, RotateCcw, ChevronDown, Clock } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Bill, Role, Room } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

interface BillManagerProps { role: Role; onUpdate?: () => void; }

const BillManager: React.FC<BillManagerProps> = ({ role, onUpdate }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'OVERDUE'>('ALL');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('ALL'); // Changed from searchTerm to dropdown ID
  const { showToast } = useToast();
  
  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean; action: 'PAY' | 'UNPAY' | 'DELETE' | null; billId: string | null; title: string; message: string; type: 'danger' | 'warning' | 'success'; confirmText: string; }>({ isOpen: false, action: null, billId: null, title: '', message: '', type: 'danger', confirmText: 'Xác nhận' });

  const fetchData = async () => {
      try {
          const [b, r] = await Promise.all([dormService.getBills(), dormService.getRooms()]);
          setBills(b.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setRooms(r.sort((a, b) => a.name.localeCompare(b.name))); // Sort rooms for dropdown
      } catch (error) { console.error(error); } finally { setLoading(false); }
  };
  
  useEffect(() => { fetchData(); }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  // Added dueDate to formData
  const [formData, setFormData] = useState({ roomId: '', month: new Date().toISOString().slice(0, 7), dueDate: '', electricIndexOld: 0, electricIndexNew: 0, waterIndexOld: 0, waterIndexNew: 0, roomFee: 0 });

  const handleRoomSelect = (roomId: string) => {
      const room = rooms.find(r => r.id === roomId);
      const prevBill = bills.find(b => b.roomId === roomId);
      
      // Calculate Default Due Date (10th of next month based on selected month or current)
      const now = new Date();
      const defaultDueDate = new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split('T')[0];

      setFormData({ 
          ...formData, 
          roomId, 
          roomFee: room ? room.pricePerMonth : 0, 
          electricIndexOld: prevBill ? prevBill.electricIndexNew : 0, 
          waterIndexOld: prevBill ? prevBill.waterIndexNew : 0, 
          electricIndexNew: 0, 
          waterIndexNew: 0,
          dueDate: formData.dueDate || defaultDueDate
      });
  };

  const handleAddNew = () => {
      setEditingId(null);
      const now = new Date();
      // Default to 10th of current month
      const defaultDueDate = new Date(now.getFullYear(), now.getMonth(), 10).toISOString().split('T')[0];
      setFormData({ roomId: '', month: now.toISOString().slice(0, 7), dueDate: defaultDueDate, electricIndexOld: 0, electricIndexNew: 0, waterIndexOld: 0, waterIndexNew: 0, roomFee: 0 });
      setShowModal(true);
  };

  const handleEdit = (bill: Bill, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (bill.status === 'PAID') return showToast("Không thể sửa hóa đơn đã thanh toán", 'warning');
    setEditingId(bill.id);
    setFormData({ 
        roomId: bill.roomId, 
        month: bill.month, 
        dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
        electricIndexOld: bill.electricIndexOld, 
        electricIndexNew: bill.electricIndexNew, 
        waterIndexOld: bill.waterIndexOld, 
        waterIndexNew: bill.waterIndexNew, 
        roomFee: bill.roomFee 
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      // Ensure dueDate is ISO string for backend
      const payload = { ...formData, dueDate: new Date(formData.dueDate).toISOString() };
      
      if (editingId) await dormService.updateBill(editingId, payload);
      else await dormService.createBill(payload);
      showToast(editingId ? 'Đã cập nhật' : 'Đã tạo hóa đơn', 'success');
      fetchData(); if (onUpdate) onUpdate(); setShowModal(false);
  };

  const executeConfirmAction = async () => {
      const { action, billId } = confirmConfig;
      if (!billId) return;
      if (action === 'PAY') await dormService.payBill(billId);
      else if (action === 'UNPAY') await dormService.unpayBill(billId);
      else if (action === 'DELETE') await dormService.deleteBill(billId);
      
      showToast('Thao tác thành công', 'success'); fetchData(); if (onUpdate) onUpdate();
      setConfirmConfig({ ...confirmConfig, isOpen: false });
  };

  const isOverdue = (bill: Bill) => bill.status !== 'PAID' && new Date() > new Date(bill.dueDate);
  
  // Helper to format Date nicely
  const formatDate = (dateString: string) => {
      if(!dateString) return '---';
      return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const filteredBills = bills.filter(bill => {
      // 1. Filter by Status
      let statusMatch = true;
      if (filter === 'PAID') statusMatch = bill.status === 'PAID';
      else if (filter === 'UNPAID') statusMatch = bill.status === 'UNPAID';
      else if (filter === 'OVERDUE') statusMatch = bill.status === 'UNPAID' && isOverdue(bill);

      // 2. Filter by Room Dropdown
      const roomMatch = selectedRoomId === 'ALL' || bill.roomId === selectedRoomId;

      return statusMatch && roomMatch;
  });

  const stats = {
    revenuePending: bills.filter(b => b.status === 'UNPAID').reduce((sum, b) => sum + b.totalAmount, 0),
    revenueCollected: bills.filter(b => b.status === 'PAID').reduce((sum, b) => sum + b.totalAmount, 0)
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Tài chính</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Quản lý thu chi và hóa đơn.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Room Filter Dropdown */}
            <div className="relative flex-1 md:w-64 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-500 transition-colors">
                        <Filter size={18}/>
                    </div>
                    <select
                        value={selectedRoomId}
                        onChange={(e) => setSelectedRoomId(e.target.value)}
                        className="w-full pl-12 pr-10 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none appearance-none cursor-pointer font-bold text-gray-700 dark:text-gray-200 transition-all hover:bg-white dark:hover:bg-gray-800"
                    >
                        <option value="ALL">Tất cả các phòng</option>
                        {rooms.map(room => (
                            <option key={room.id} value={room.id}>Phòng {room.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={16} />
                    </div>
            </div>

            {role === Role.ADMIN && (
                <button onClick={handleAddNew} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap">
                    <Plus size={20} /> Tạo Hóa Đơn
                </button>
            )}
        </div>
      </div>

      {/* Summary Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 dark:border-gray-700/50 shadow-sm flex justify-between items-center relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
              <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cần thu</p>
                  <h3 className="text-3xl font-black text-amber-600 dark:text-amber-500 mt-1">{stats.revenuePending.toLocaleString()} đ</h3>
              </div>
              <div className="p-4 bg-amber-100 dark:bg-amber-900/30 rounded-2xl text-amber-600 shadow-inner">
                  <AlertTriangle size={28} />
              </div>
          </div>
          <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/40 dark:border-gray-700/50 shadow-sm flex justify-between items-center relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-150 transition-transform"></div>
              <div>
                  <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Thực thu</p>
                  <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-500 mt-1">{stats.revenueCollected.toLocaleString()} đ</h3>
              </div>
              <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl text-emerald-600 shadow-inner">
                  <CheckCircle size={28} />
              </div>
          </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-white/30 dark:border-gray-700/30">
          {(['ALL', 'UNPAID', 'OVERDUE', 'PAID'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                {f === 'ALL' ? 'Tất cả' : f === 'UNPAID' ? 'Chưa thu' : f === 'OVERDUE' ? 'Quá hạn' : 'Đã thu'}
              </button>
          ))}
      </div>

      {/* Bills Grid (Credit Card Style) */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredBills.length > 0 ? (
                filteredBills.map(bill => {
                    const roomName = rooms.find(r => r.id === bill.roomId)?.name || bill.roomId;
                    const overdue = isOverdue(bill);
                    const isPaid = bill.status === 'PAID';
                    
                    // Dynamic Glass Styles based on status
                    const glassStyle = isPaid 
                        ? 'bg-gradient-to-br from-white/60 to-emerald-50/40 dark:from-gray-800/60 dark:to-emerald-900/10 border-emerald-100 dark:border-emerald-900/30'
                        : overdue 
                            ? 'bg-gradient-to-br from-white/60 to-red-50/40 dark:from-gray-800/60 dark:to-red-900/10 border-red-100 dark:border-red-900/30'
                            : 'bg-gradient-to-br from-white/60 to-gray-50/40 dark:from-gray-800/60 dark:to-gray-900/10 border-white/50 dark:border-gray-700/50';

                    return (
                        <div key={bill.id} className={`relative p-6 rounded-[2rem] border backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-300 ${glassStyle} flex flex-col cursor-default`}>
                            
                            {/* Status Light & Edit Button */}
                            <div className="absolute top-6 right-6 flex items-center gap-3">
                                {role === Role.ADMIN && !isPaid && (
                                    <button onClick={(e) => handleEdit(bill, e)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-white/50 transition-colors">
                                        <Edit size={16}/>
                                    </button>
                                )}
                                <div className={`w-3 h-3 rounded-full ${isPaid ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : overdue ? 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse' : 'bg-amber-400'}`}></div>
                            </div>

                            <div className="mb-6">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <Calendar size={12}/> {formatDate(bill.createdAt)}
                                </p>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white">P. {roomName}</h3>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                    <Clock size={12} className={overdue ? "text-red-500" : ""}/> 
                                    Hạn: <span className={overdue ? "text-red-600 font-bold" : "font-semibold"}>{formatDate(bill.dueDate)}</span>
                                </p>
                            </div>

                            <div className="flex-1 space-y-3 mb-6">
                                <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-700/30 rounded-xl border border-white/40 dark:border-white/5">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300"><Zap size={16} className="text-yellow-500"/> Điện</div>
                                    <span className="font-bold text-gray-900 dark:text-white">{((bill.electricIndexNew - bill.electricIndexOld) * 3500).toLocaleString()} đ</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-700/30 rounded-xl border border-white/40 dark:border-white/5">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300"><Droplets size={16} className="text-blue-500"/> Nước</div>
                                    <span className="font-bold text-gray-900 dark:text-white">{((bill.waterIndexNew - bill.waterIndexOld) * 10000).toLocaleString()} đ</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white/50 dark:bg-gray-700/30 rounded-xl border border-white/40 dark:border-white/5">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300"><Home size={16} className="text-purple-500"/> Phòng</div>
                                    <span className="font-bold text-gray-900 dark:text-white">{bill.roomFee.toLocaleString()} đ</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Tổng cộng</span>
                                    <span className="text-3xl font-black text-gray-900 dark:text-white">{bill.totalAmount.toLocaleString()}</span>
                                </div>

                                {role === Role.ADMIN && (
                                    <div className="flex gap-2">
                                        {isPaid ? (
                                            <div className="flex-1 flex gap-2">
                                                <div className="flex-1 py-3 bg-gray-100 dark:bg-gray-700/50 text-gray-400 font-bold rounded-xl flex items-center justify-center gap-2 cursor-default">
                                                    <CheckCircle size={18}/> Đã thanh toán
                                                </div>
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfirmConfig({ 
                                                            isOpen: true, 
                                                            action: 'UNPAY', 
                                                            billId: bill.id, 
                                                            title: 'Hoàn tác thu tiền', 
                                                            message: 'Bạn có chắc chắn muốn hủy trạng thái đã thanh toán của hóa đơn này?', 
                                                            type: 'warning', 
                                                            confirmText: 'Hoàn tiền' 
                                                        });
                                                    }}
                                                    className="p-3 bg-white dark:bg-gray-700 text-amber-500 hover:text-amber-600 rounded-xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all"
                                                    title="Hoàn tác (Chưa thanh toán)"
                                                >
                                                    <RotateCcw size={20}/>
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => setConfirmConfig({ isOpen: true, action: 'PAY', billId: bill.id, title: 'Thu tiền', message: 'Xác nhận đã thu tiền?', type: 'success', confirmText: 'Đã thu' })}
                                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
                                            >
                                                Thu tiền
                                            </button>
                                        )}
                                        <button 
                                            onClick={(e) => { 
                                                e.stopPropagation();
                                                setConfirmConfig({ isOpen: true, action: 'DELETE', billId: bill.id, title: 'Xóa', message: 'Xóa hóa đơn?', type: 'danger', confirmText: 'Xóa' });
                                            }} 
                                            className="p-3 bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl border border-gray-100 dark:border-gray-600 hover:shadow-md transition-all"
                                        >
                                            <Trash2 size={20}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            ) : (
                 <div className="col-span-full py-10 text-center text-gray-400 italic">Không có hóa đơn nào phù hợp.</div>
            )}
      </div>
      
      <ConfirmationModal isOpen={confirmConfig.isOpen} onClose={() => setConfirmConfig({...confirmConfig, isOpen: false})} onConfirm={executeConfirmAction} title={confirmConfig.title} message={confirmConfig.message} confirmText={confirmConfig.confirmText} type={confirmConfig.type} />
      
      {showModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-lg animate-fade-in">
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-lg p-8 shadow-2xl animate-scale-in border border-white/20 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-2xl font-black mb-6 dark:text-white">{editingId ? 'Cập nhật' : 'Hóa Đơn Mới'}</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Form Fields Simplified for brevity but kept functional logic */}
                      <select required value={formData.roomId} onChange={e => handleRoomSelect(e.target.value)} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold">
                           <option value="">Chọn Phòng</option>
                           {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Hóa đơn cho tháng</label>
                             <input 
                                type="month" 
                                required 
                                value={formData.month} 
                                onChange={e => {
                                    const newMonth = e.target.value;
                                    let newDueDate = formData.dueDate;
                                    
                                    if (newMonth) {
                                        // Get current day from dueDate or default to 10
                                        let dayStr = '10';
                                        if (formData.dueDate) {
                                            const parts = formData.dueDate.split('-');
                                            if (parts.length === 3) dayStr = parts[2];
                                        }
                                        
                                        // Validate day against new month
                                        const [y, m] = newMonth.split('-').map(Number);
                                        const daysInNewMonth = new Date(y, m, 0).getDate();
                                        let day = parseInt(dayStr, 10);
                                        if (day > daysInNewMonth) day = daysInNewMonth;
                                        
                                        newDueDate = `${newMonth}-${day.toString().padStart(2, '0')}`;
                                    }
                                    
                                    setFormData({...formData, month: newMonth, dueDate: newDueDate});
                                }} 
                                className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold" 
                             />
                         </div>
                         <div>
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-2 mb-1 block">Hạn thanh toán</label>
                             <input type="date" required value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold" />
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Điện Mới</label>
                              <input type="number" value={formData.electricIndexNew} onChange={e => setFormData({...formData, electricIndexNew: Number(e.target.value)})} className="w-full bg-transparent outline-none font-bold text-lg" />
                          </div>
                           <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Điện Cũ</label>
                              <input type="number" value={formData.electricIndexOld} onChange={e => setFormData({...formData, electricIndexOld: Number(e.target.value)})} className="w-full bg-transparent outline-none font-bold text-lg" />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Nước Mới</label>
                              <input type="number" value={formData.waterIndexNew} onChange={e => setFormData({...formData, waterIndexNew: Number(e.target.value)})} className="w-full bg-transparent outline-none font-bold text-lg" />
                          </div>
                           <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                              <label className="text-[10px] font-bold text-gray-400 uppercase">Nước Cũ</label>
                              <input type="number" value={formData.waterIndexOld} onChange={e => setFormData({...formData, waterIndexOld: Number(e.target.value)})} className="w-full bg-transparent outline-none font-bold text-lg" />
                          </div>
                      </div>

                      <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg mt-4">Lưu Hóa Đơn</button>
                      <button type="button" onClick={() => setShowModal(false)} className="w-full py-4 bg-transparent text-gray-500 font-bold rounded-2xl">Hủy</button>
                  </form>
              </div>
          </div>, document.body
      )}
    </div>
  );
};

export default BillManager;
