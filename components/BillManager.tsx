
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, X, Calendar, CheckCircle, AlertTriangle, DollarSign, Droplets, Zap, Home, Filter } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Bill, Role, Room } from '../types';

interface BillManagerProps {
    role: Role;
}

const BillManager: React.FC<BillManagerProps> = ({ role }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNPAID' | 'PAID' | 'OVERDUE'>('ALL');
  
  const fetchData = async () => {
      try {
          const [b, r] = await Promise.all([dormService.getBills(), dormService.getRooms()]);
          // Sort bills: Unpaid & Overdue first, then by date desc
          const sortedBills = b.sort((a, b) => {
              if (a.status === b.status) {
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }
              return a.status === 'UNPAID' ? -1 : 1;
          });
          setBills(sortedBills);
          setRooms(r);
      } catch (error) {
          console.error(error);
      } finally {
          setLoading(false);
      }
  };
  
  useEffect(() => { fetchData(); }, []);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
      roomId: '',
      month: new Date().toISOString().slice(0, 7),
      electricIndexOld: 0,
      electricIndexNew: 0,
      waterIndexOld: 0,
      waterIndexNew: 0,
      roomFee: 0
  });

  const calculateTotal = () => {
    const elec = Math.max(0, (formData.electricIndexNew - formData.electricIndexOld) * 3500);
    const water = Math.max(0, (formData.waterIndexNew - formData.waterIndexOld) * 10000);
    return elec + water + Number(formData.roomFee);
  };

  const handleRoomSelect = (roomId: string) => {
      const room = rooms.find(r => r.id === roomId);
      // Mock logic: try to find previous bill to auto-fill old indexes
      const prevBill = bills.find(b => b.roomId === roomId);
      
      setFormData({
          ...formData, 
          roomId,
          roomFee: room ? room.pricePerMonth : 0,
          electricIndexOld: prevBill ? prevBill.electricIndexNew : 0,
          waterIndexOld: prevBill ? prevBill.waterIndexNew : 0,
          electricIndexNew: 0, // Reset new values
          waterIndexNew: 0
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

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (formData.electricIndexNew < formData.electricIndexOld) {
          alert("Lỗi: Chỉ số điện mới phải lớn hơn hoặc bằng chỉ số cũ.");
          return;
      }
      if (formData.waterIndexNew < formData.waterIndexOld) {
          alert("Lỗi: Chỉ số nước mới phải lớn hơn hoặc bằng chỉ số cũ.");
          return;
      }
      if (Number(formData.roomFee) < 0) {
          alert("Lỗi: Tiền phòng không được âm.");
          return;
      }

      if (editingId) {
          await dormService.updateBill(editingId, formData);
      } else {
          await dormService.createBill(formData);
      }
      fetchData();
      setShowModal(false);
      setEditingId(null);
  };

  const handlePay = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      e.preventDefault();
      if(window.confirm("Xác nhận hóa đơn này đã được khách thanh toán?")) {
        await dormService.payBill(id);
        fetchData();
      }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if(window.confirm("Bạn có chắc muốn xóa hóa đơn này không?")) {
          await dormService.deleteBill(id);
          fetchData();
      }
  };

  const isOverdue = (bill: Bill) => {
      if (bill.status === 'PAID') return false;
      const today = new Date();
      const due = new Date(bill.dueDate);
      return today > due;
  };

  const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  const filteredBills = bills.filter(bill => {
      if (filter === 'ALL') return true;
      if (filter === 'PAID') return bill.status === 'PAID';
      if (filter === 'UNPAID') return bill.status === 'UNPAID';
      if (filter === 'OVERDUE') return bill.status === 'UNPAID' && isOverdue(bill);
      return true;
  });

  const stats = {
      total: bills.length,
      paid: bills.filter(b => b.status === 'PAID').length,
      unpaid: bills.filter(b => b.status === 'UNPAID').length,
      overdue: bills.filter(b => b.status === 'UNPAID' && isOverdue(b)).length
  };

  if (loading && bills.length === 0) return <div className="p-10 text-center">Đang tải dữ liệu hóa đơn...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hóa đơn & Điện nước</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Quản lý thu tiền và theo dõi công nợ.</p>
        </div>
        {role === Role.ADMIN && (
            <button 
            onClick={handleAddNew}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
            <Plus size={18} />
            <span>Tạo Hóa Đơn</span>
            </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 bg-white dark:bg-gray-800 p-1.5 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 w-fit">
          <button 
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'ALL' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
          >
            Tất cả <span className="ml-1 text-xs bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full">{stats.total}</span>
          </button>
          <button 
            onClick={() => setFilter('UNPAID')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'UNPAID' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm border border-amber-100 dark:border-transparent' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
          >
            Chưa thu <span className="ml-1 text-xs bg-amber-100 dark:bg-amber-800/50 px-1.5 py-0.5 rounded-full">{stats.unpaid}</span>
          </button>
          <button 
            onClick={() => setFilter('OVERDUE')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'OVERDUE' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 shadow-sm border border-red-100 dark:border-transparent' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
          >
            Quá hạn <span className="ml-1 text-xs bg-red-100 dark:bg-red-800/50 px-1.5 py-0.5 rounded-full">{stats.overdue}</span>
          </button>
          <button 
            onClick={() => setFilter('PAID')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'PAID' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm border border-green-100 dark:border-transparent' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
          >
            Đã thu <span className="ml-1 text-xs bg-green-100 dark:bg-green-800/50 px-1.5 py-0.5 rounded-full">{stats.paid}</span>
          </button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {filteredBills.length === 0 ? (
              <div className="col-span-full py-12 text-center text-gray-400">
                  <Filter size={48} className="mx-auto mb-4 opacity-20"/>
                  <p>Không tìm thấy hóa đơn nào theo bộ lọc này.</p>
              </div>
          ) : (
            filteredBills.map(bill => {
                const roomName = rooms.find(r => r.id === bill.roomId)?.name || bill.roomId;
                const overdue = isOverdue(bill);
                const isPaid = bill.status === 'PAID';
                
                // Status styling
                let borderColor = 'border-gray-200 dark:border-gray-700';
                let badgeClass = 'bg-gray-100 text-gray-600';
                let statusIcon = <AlertTriangle size={14}/>;
                let statusText = 'Chưa thanh toán';

                if (isPaid) {
                    borderColor = 'border-green-200 dark:border-green-900/50';
                    badgeClass = 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400';
                    statusIcon = <CheckCircle size={14}/>;
                    statusText = 'Đã thanh toán';
                } else if (overdue) {
                    borderColor = 'border-red-300 dark:border-red-800';
                    badgeClass = 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400';
                    statusIcon = <AlertTriangle size={14}/>;
                    statusText = 'Quá hạn';
                } else {
                    badgeClass = 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
                }

                return (
                    <div key={bill.id} className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-2 relative overflow-hidden group transition-all duration-300 hover:shadow-md ${borderColor}`}>
                        
                        {/* Decorative Corner */}
                        <div className={`absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full opacity-10 pointer-events-none ${isPaid ? 'bg-green-500' : overdue ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                        
                        {/* Header */}
                        <div className="mb-4 relative z-10 flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Phòng {roomName}
                                </h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    <Calendar size={14}/> <span className="font-medium">Tháng {bill.month}</span>
                                </div>
                            </div>
                            
                            {/* Admin Actions */}
                            {role === Role.ADMIN && (
                                <div className="flex gap-1">
                                    <button 
                                        type="button"
                                        onClick={(e) => handleEdit(bill, e)} 
                                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        title="Sửa"
                                    >
                                        <Edit size={16}/>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDelete(bill.id, e)} 
                                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Status Badge */}
                        <div className="mb-5">
                            <div className="flex items-center justify-between">
                                <span className={`flex items-center gap-1.5 text-sm font-bold px-2.5 py-1 rounded-md border border-transparent ${badgeClass}`}>
                                    {statusIcon} {statusText}
                                </span>
                                {!isPaid && (
                                    <span className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
                                        Hạn: {formatDate(bill.dueDate)}
                                    </span>
                                )}
                                {isPaid && bill.paymentDate && (
                                    <span className="text-xs text-green-600 dark:text-green-500 font-medium">
                                        {formatDate(bill.paymentDate)}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Bill Details */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3 text-sm border border-gray-100 dark:border-gray-700/50 relative z-10">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Zap size={14} className="text-yellow-500"/> 
                                    <span>Điện ({bill.electricIndexNew - bill.electricIndexOld} số)</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">
                                    {((bill.electricIndexNew - bill.electricIndexOld) * 3500).toLocaleString()} đ
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Droplets size={14} className="text-blue-500"/> 
                                    <span>Nước ({bill.waterIndexNew - bill.waterIndexOld} m³)</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">
                                    {((bill.waterIndexNew - bill.waterIndexOld) * 10000).toLocaleString()} đ
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <Home size={14} className="text-indigo-500"/> 
                                    <span>Tiền phòng</span>
                                </div>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">{bill.roomFee.toLocaleString()} đ</span>
                            </div>
                        </div>

                        {/* Footer / Total & Action */}
                        <div className="mt-5 relative z-10">
                            <div className="flex justify-between items-end mb-4">
                               <span className="text-gray-500 dark:text-gray-400 text-xs uppercase font-bold tracking-wider">Tổng thanh toán</span>
                               <span className={`text-2xl font-black ${isPaid ? 'text-green-600 dark:text-green-400' : 'text-indigo-700 dark:text-indigo-400'}`}>
                                  {bill.totalAmount.toLocaleString()} đ
                               </span>
                            </div>
                            
                            {!isPaid && role === Role.ADMIN && (
                                <button 
                                  onClick={(e) => handlePay(e, bill.id)} 
                                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95"
                                >
                                    <DollarSign size={16}/> Xác nhận đã thu tiền
                                </button>
                            )}
                        </div>
                    </div>
                );
            })
          )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto animate-fade-in-up">
                <div className="flex justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Cập nhật Hóa Đơn' : 'Lập Hóa Đơn Mới'}</h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                             <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Chọn Phòng</label>
                             <select required value={formData.roomId} onChange={e => handleRoomSelect(e.target.value)} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="">-- Chọn --</option>
                                {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                             <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Tháng thu tiền</label>
                             <input type="month" required value={formData.month} onChange={e => setFormData({...formData, month: e.target.value})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-yellow-600 dark:text-yellow-400">
                            <Zap size={16}/> Chỉ số Điện (3.500đ / kWh)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Chỉ số Cũ</label>
                                <input type="number" min="0" required value={formData.electricIndexOld} onChange={e => setFormData({...formData, electricIndexOld: Number(e.target.value)})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Chỉ số Mới</label>
                                <input type="number" min="0" required value={formData.electricIndexNew} onChange={e => setFormData({...formData, electricIndexNew: Number(e.target.value)})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-indigo-600" />
                            </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            Sử dụng: {Math.max(0, formData.electricIndexNew - formData.electricIndexOld)} số
                        </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-600 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-bold text-blue-600 dark:text-blue-400">
                            <Droplets size={16}/> Chỉ số Nước (10.000đ / m³)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Chỉ số Cũ</label>
                                <input type="number" min="0" required value={formData.waterIndexOld} onChange={e => setFormData({...formData, waterIndexOld: Number(e.target.value)})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500 dark:text-gray-400">Chỉ số Mới</label>
                                <input type="number" min="0" required value={formData.waterIndexNew} onChange={e => setFormData({...formData, waterIndexNew: Number(e.target.value)})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-bold text-indigo-600" />
                            </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            Sử dụng: {Math.max(0, formData.waterIndexNew - formData.waterIndexOld)} khối
                        </div>
                    </div>

                    <div className="space-y-1">
                         <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Tiền phòng cố định (VNĐ)</label>
                         <input type="number" min="0" required value={formData.roomFee} onChange={e => setFormData({...formData, roomFee: Number(e.target.value)})} className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl flex justify-between items-center border border-indigo-100 dark:border-indigo-800">
                        <span className="font-bold text-gray-700 dark:text-gray-200">Tổng cộng dự kiến:</span>
                        <span className="text-xl font-black text-indigo-700 dark:text-indigo-400">{calculateTotal().toLocaleString()} đ</span>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 dark:shadow-none">
                        {editingId ? 'Lưu thay đổi' : 'Hoàn tất tạo hóa đơn'}
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default BillManager;
