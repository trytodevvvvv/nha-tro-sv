
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { dormService } from '../services/dormService';
import { RoomStatus, Room, Role, Building, Student, Asset, AssetStatus } from '../types';
import { Plus, X, Trash2, Users, ChevronRight, Monitor, Search, ArrowRightLeft } from 'lucide-react';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

interface RoomManagerProps {
    onUpdate: () => void;
    role: Role;
}

const RoomManager: React.FC<RoomManagerProps> = ({ onUpdate, role }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  const { showToast } = useToast();

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; roomId: string | null; }>({ isOpen: false, roomId: null });
  
  // Move Student State
  const [moveStudentModal, setMoveStudentModal] = useState<{isOpen: boolean; studentId: string | null; currentRoomName: string;}>({ isOpen: false, studentId: null, currentRoomName: '' });
  const [targetRoomId, setTargetRoomId] = useState('');

  const fetchData = async () => {
      setLoading(true);
      try {
        const [r, b] = await Promise.all([dormService.getRooms(), dormService.getBuildings()]);
        setRooms(r);
        setBuildings(b);
      } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [onUpdate]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); 
  const [activeDetailTab, setActiveDetailTab] = useState<'residents' | 'assets' | 'settings'>('residents');
  const [roomStudents, setRoomStudents] = useState<Student[]>([]);
  const [roomAssets, setRoomAssets] = useState<Asset[]>([]);

  const [newRoomData, setNewRoomData] = useState<Partial<Room>>({ name: '', buildingId: '', maxCapacity: 4, pricePerMonth: 0, status: RoomStatus.AVAILABLE });
  const [editRoomData, setEditRoomData] = useState<Partial<Room>>({});

  const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newRoomData.name && newRoomData.buildingId) {
          await dormService.addRoom(newRoomData);
          setShowAddModal(false);
          setNewRoomData({ name: '', buildingId: '', maxCapacity: 4, pricePerMonth: 0, status: RoomStatus.AVAILABLE });
          fetchData();
          onUpdate();
          showToast('Đã thêm phòng mới thành công', 'success');
      }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedRoom && editRoomData) {
          const newStatus = editRoomData.status;
          const currentCap = selectedRoom.currentCapacity;
          const maxCap = editRoomData.maxCapacity !== undefined ? editRoomData.maxCapacity : selectedRoom.maxCapacity;

          if (newStatus === RoomStatus.MAINTENANCE && currentCap > 0) {
              showToast("Không thể chuyển sang 'Bảo trì' vì phòng đang có người ở! Vui lòng chuyển cư dân đi trước.", 'warning');
              return;
          }
          if (newStatus === RoomStatus.AVAILABLE && currentCap >= maxCap) {
              showToast("Phòng đã đủ số lượng người, không thể chuyển sang trạng thái 'Còn trống'.", 'warning');
              return;
          }

          await dormService.updateRoom(selectedRoom.id, editRoomData);
          fetchData();
          onUpdate();
          setSelectedRoom({ ...selectedRoom, ...editRoomData } as Room);
          showToast("Cập nhật thông tin phòng thành công", 'success');
      }
  };

  const confirmDelete = async () => {
      if (confirmModal.roomId) {
          const res = await dormService.deleteRoom(confirmModal.roomId);
          if(res.success) {
              showToast('Đã xóa phòng', 'success');
              fetchData();
              onUpdate();
          } else {
              showToast(res.message || "Lỗi xóa phòng", 'error');
          }
      }
      setConfirmModal({ isOpen: false, roomId: null });
  };

  const handleMoveStudent = async () => {
      if(moveStudentModal.studentId && targetRoomId) {
          const res = await dormService.updateStudent(moveStudentModal.studentId, { roomId: targetRoomId });
          if (res.success !== false) {
              showToast('Đã chuyển phòng thành công', 'success');
              setMoveStudentModal({ isOpen: false, studentId: null, currentRoomName: '' });
              setTargetRoomId('');
              
              // Refresh data
              fetchData();
              onUpdate();
              if (selectedRoom) {
                  // Re-fetch detail for current room (mostly to update list locally)
                  const allStudents = await dormService.getStudents();
                  setRoomStudents(allStudents.filter(s => s.roomId === selectedRoom.id));
              }
          } else {
              showToast(res.message || 'Lỗi chuyển phòng', 'error');
          }
      }
  };

  const openDetailModal = async (room: Room) => {
      setSelectedRoom(room);
      setEditRoomData(room);
      setActiveDetailTab('residents');
      const [allStudents, allAssets] = await Promise.all([dormService.getStudents(), dormService.getAssets()]);
      setRoomStudents(allStudents.filter(s => s.roomId === room.id));
      setRoomAssets(allAssets.filter(a => a.roomId === room.id));
  };

  const getStatusConfig = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return { label: 'Còn trống', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' };
      case RoomStatus.FULL: return { label: 'Đã đầy', color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' };
      case RoomStatus.MAINTENANCE: return { label: 'Bảo trì', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' };
      default: return { label: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  // Filter Logic
  const filteredRooms = rooms.filter(r => {
      const searchLower = searchTerm.toLowerCase();
      const buildingName = buildings.find(b => b.id === r.buildingId)?.name || '';
      return (
          r.name.toLowerCase().includes(searchLower) ||
          buildingName.toLowerCase().includes(searchLower)
      );
  });

  if (loading) return <div className="p-10 text-center text-gray-400 font-medium">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Quản lý Phòng</h2>
                <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Theo dõi trạng thái và cư dân từng phòng.</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                    <input 
                        placeholder="Tìm phòng..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                    />
                </div>
                {role === Role.ADMIN && (
                    <button onClick={() => setShowAddModal(true)} className="group bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-[1.2rem] font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap">
                        <Plus size={20} className="group-hover:rotate-90 transition-transform"/> Thêm Phòng
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
        {filteredRooms.length > 0 ? (
            filteredRooms.map(room => {
                const status = getStatusConfig(room.status as RoomStatus);
                const percentage = (room.currentCapacity / room.maxCapacity) * 100;
                
                return (
                    <div 
                        key={room.id} 
                        onClick={() => openDetailModal(room)}
                        className="group relative bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-[1.8rem] p-5 border border-white/50 dark:border-gray-700/50 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden transform-gpu"
                    >
                        {/* Simplified Progress Bar */}
                        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500" style={{ width: `${percentage}%` }}></div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block truncate">{buildings.find(b => b.id === room.buildingId)?.name}</span>
                                <h3 className="text-2xl font-black text-gray-800 dark:text-white leading-none">{room.name}</h3>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${status.bg} ${status.color}`}>
                                {status.label}
                            </span>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex items-end justify-between">
                                <div className="flex -space-x-2 overflow-hidden">
                                    {Array.from({ length: Math.min(3, room.currentCapacity) }).map((_, i) => (
                                        <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
                                            <Users size={12}/>
                                        </div>
                                    ))}
                                    {room.currentCapacity > 3 && (
                                        <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500">+{room.currentCapacity - 3}</div>
                                    )}
                                    {room.currentCapacity === 0 && <span className="text-sm text-gray-400 font-medium italic">Chưa có người</span>}
                                </div>
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{room.currentCapacity} / {room.maxCapacity}</span>
                            </div>

                            <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{room.pricePerMonth.toLocaleString()} đ</span>
                                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white group-hover:bg-indigo-50 dark:group-hover:bg-indigo-600 transition-all shadow-sm">
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })
        ) : (
            <div className="col-span-full py-10 text-center text-gray-400 italic">Không tìm thấy phòng nào phù hợp.</div>
        )}
        </div>

        <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmDelete} title="Xóa Phòng" message="Hành động này không thể hoàn tác." type="danger" />

        {/* Add Room Modal */}
        {showAddModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-white/20 animate-scale-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">Phòng Mới</h3>
                      <button onClick={() => setShowAddModal(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Tên (vd: 101)" value={newRoomData.name} onChange={e => setNewRoomData({...newRoomData, name: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-indigo-500/50 w-full outline-none font-medium" />
                        <select required value={newRoomData.buildingId} onChange={e => setNewRoomData({...newRoomData, buildingId: e.target.value})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-indigo-500/50 w-full outline-none font-medium">
                             <option value="">Chọn Tòa</option>
                             {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input type="number" placeholder="Sức chứa" value={newRoomData.maxCapacity} onChange={e => setNewRoomData({...newRoomData, maxCapacity: Number(e.target.value)})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-indigo-500/50 w-full outline-none font-medium" />
                        <input type="number" placeholder="Giá thuê" value={newRoomData.pricePerMonth} onChange={e => setNewRoomData({...newRoomData, pricePerMonth: Number(e.target.value)})} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-indigo-500/50 w-full outline-none font-medium" />
                      </div>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-all">Tạo Phòng</button>
                  </form>
              </div>
          </div>, document.body
        )}

        {/* Move Student Modal */}
        {moveStudentModal.isOpen && createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-[2rem] w-full max-w-sm p-6 shadow-2xl border border-white/20 animate-scale-in">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">Chuyển phòng</h3>
                        <button onClick={() => setMoveStudentModal({...moveStudentModal, isOpen: false})} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"><X size={16}/></button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Hiện tại: <span className="font-bold text-gray-800 dark:text-white">{moveStudentModal.currentRoomName}</span></p>
                    
                    <div className="space-y-4">
                         <div>
                             <label className="text-xs font-bold text-gray-400 uppercase ml-1 mb-1 block">Chọn phòng mới</label>
                             <select 
                                value={targetRoomId} 
                                onChange={(e) => setTargetRoomId(e.target.value)} 
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border-none outline-none font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50"
                             >
                                 <option value="">-- Chọn phòng --</option>
                                 {rooms.filter(r => r.currentCapacity < r.maxCapacity && r.id !== selectedRoom?.id && r.status !== RoomStatus.MAINTENANCE).map(r => (
                                     <option key={r.id} value={r.id}>{r.name} (Còn trống: {r.maxCapacity - r.currentCapacity})</option>
                                 ))}
                             </select>
                         </div>
                         <button 
                            onClick={handleMoveStudent} 
                            disabled={!targetRoomId}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                        >
                            Xác nhận chuyển
                         </button>
                    </div>
                </div>
            </div>, document.body
        )}

        {/* Detail Modal */}
        {selectedRoom && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-[2rem] w-full max-w-2xl h-[650px] shadow-2xl flex flex-col overflow-hidden animate-scale-in border border-white/20">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    {selectedRoom.name}
                                    <span className="text-sm font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{buildings.find(b => b.id === selectedRoom.buildingId)?.name}</span>
                                </h2>
                            </div>
                            <button onClick={() => setSelectedRoom(null)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 transition-colors"><X size={20}/></button>
                        </div>
                        <div className="flex gap-3 relative z-10">
                             <div className="flex-1 bg-white dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                                 <p className="text-xs font-bold text-gray-400 uppercase mb-1">Giá thuê</p>
                                 <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{selectedRoom.pricePerMonth.toLocaleString()} đ</p>
                             </div>
                             <div className="flex-1 bg-white dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 shadow-sm">
                                 <p className="text-xs font-bold text-gray-400 uppercase mb-1">Trạng thái</p>
                                 <p className={`text-lg font-black ${getStatusConfig(selectedRoom.status as RoomStatus).color}`}>{getStatusConfig(selectedRoom.status as RoomStatus).label}</p>
                             </div>
                             {role === Role.ADMIN && (
                                <button onClick={(e) => {setConfirmModal({isOpen: true, roomId: selectedRoom.id}); setSelectedRoom(null);}} className="px-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 transition-colors border border-red-100 dark:border-transparent">
                                    <Trash2 size={20} />
                                </button>
                             )}
                        </div>
                    </div>

                    <div className="flex border-b border-gray-100 dark:border-gray-700 px-6">
                        {['residents', 'assets', 'settings'].map(tab => (
                            <button 
                                key={tab}
                                onClick={() => setActiveDetailTab(tab as any)}
                                className={`py-3 px-6 text-sm font-bold border-b-2 transition-all capitalize ${activeDetailTab === tab ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab === 'residents' ? 'Cư dân' : tab === 'assets' ? 'Tài sản' : 'Cài đặt'}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-800/30">
                        {activeDetailTab === 'residents' && (
                            <div className="space-y-3">
                                {roomStudents.length > 0 ? (
                                    roomStudents.map(s => (
                                        <div key={s.id} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm group">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">{s.name.charAt(0)}</div>
                                            <div className="flex-1">
                                                <div className="font-bold text-gray-900 dark:text-white">{s.name}</div>
                                                <div className="text-xs font-medium text-gray-500 mt-0.5">{s.studentCode} • {s.phone}</div>
                                            </div>
                                            {/* Move Button */}
                                            <button 
                                                onClick={() => setMoveStudentModal({isOpen: true, studentId: s.id, currentRoomName: selectedRoom.name})}
                                                className="p-2 bg-gray-50 dark:bg-gray-600 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                title="Chuyển phòng"
                                            >
                                                <ArrowRightLeft size={18} />
                                            </button>
                                        </div>
                                    ))
                                ) : <div className="text-center py-10 text-gray-400 font-medium italic">Phòng chưa có sinh viên.</div>}
                            </div>
                        )}
                         {activeDetailTab === 'assets' && (
                            <div className="space-y-3">
                                {roomAssets.map(a => (
                                    <div key={a.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-100 dark:border-gray-600 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-600 rounded-xl"><Monitor size={18} className="text-gray-500 dark:text-gray-300"/></div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white">{a.name}</p>
                                                <p className="text-xs text-gray-500">{a.value.toLocaleString()} đ</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${a.status === AssetStatus.GOOD ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeDetailTab === 'settings' && role === Role.ADMIN && (
                            <form onSubmit={handleEditSubmit} className="space-y-5">
                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Trạng thái phòng</label>
                                     <select 
                                        value={editRoomData.status} 
                                        onChange={(e) => setEditRoomData({...editRoomData, status: e.target.value as RoomStatus})} 
                                        className="w-full p-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold dark:text-white"
                                     >
                                         <option value={RoomStatus.AVAILABLE}>Đang hoạt động (Available)</option>
                                         <option value={RoomStatus.MAINTENANCE}>Bảo trì (Maintenance)</option>
                                         <option value={RoomStatus.FULL}>Đã đầy (Full)</option>
                                     </select>
                                 </div>

                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Giá phòng</label>
                                     <input type="number" value={editRoomData.pricePerMonth} onChange={e => setEditRoomData({...editRoomData, pricePerMonth: Number(e.target.value)})} className="w-full p-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold dark:text-white" />
                                 </div>
                                 <div className="space-y-2">
                                     <label className="text-xs font-bold text-gray-500 uppercase ml-1">Sức chứa tối đa</label>
                                     <input type="number" value={editRoomData.maxCapacity} onChange={e => setEditRoomData({...editRoomData, maxCapacity: Number(e.target.value)})} className="w-full p-4 bg-white dark:bg-gray-700 rounded-2xl border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-indigo-500/50 font-bold dark:text-white" />
                                 </div>
                                 <button type="submit" className="w-full py-4 bg-gray-900 dark:bg-indigo-600 text-white rounded-2xl font-bold hover:shadow-lg transition-all">Lưu Thay Đổi</button>
                            </form>
                        )}
                    </div>
                </div>
            </div>, document.body
        )}
    </div>
  );
};

export default RoomManager;
