
import React, { useState, useEffect } from 'react';
import { dormService } from '../services/dormService';
import { RoomStatus, Room, Role, Building, Student, Guest, Asset, AssetStatus } from '../types';
import { User, Plus, X, Trash2, Save, Users, DollarSign, BedDouble, Monitor, Clock, ShieldCheck, AlertTriangle, Wrench, CheckCircle } from 'lucide-react';

interface RoomManagerProps {
    onUpdate: () => void;
    role: Role;
}

const RoomManager: React.FC<RoomManagerProps> = ({ onUpdate, role }) => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);

  // Data fetching
  const fetchData = async () => {
      setLoading(true);
      try {
        const [r, b] = await Promise.all([dormService.getRooms(), dormService.getBuildings()]);
        setRooms(r);
        setBuildings(b);
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // Re-fetch when parent signals update
  useEffect(() => {
      fetchData();
  }, [onUpdate]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null); 
  const [activeDetailTab, setActiveDetailTab] = useState<'residents' | 'assets' | 'settings'>('residents');
  
  // Detail data states
  const [roomStudents, setRoomStudents] = useState<Student[]>([]);
  const [roomGuests, setRoomGuests] = useState<Guest[]>([]);
  const [roomAssets, setRoomAssets] = useState<Asset[]>([]);

  const [newRoomData, setNewRoomData] = useState<Partial<Room>>({
      name: '',
      buildingId: '',
      maxCapacity: 4,
      pricePerMonth: 0,
      status: RoomStatus.AVAILABLE
  });

  const [editRoomData, setEditRoomData] = useState<Partial<Room>>({});

  const handleAddSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(newRoomData.name && newRoomData.buildingId) {
          await dormService.addRoom(newRoomData);
          setShowAddModal(false);
          setNewRoomData({ name: '', buildingId: '', maxCapacity: 4, pricePerMonth: 0, status: RoomStatus.AVAILABLE });
          fetchData();
          onUpdate();
      }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedRoom && editRoomData) {
          await dormService.updateRoom(selectedRoom.id, editRoomData);
          fetchData();
          onUpdate();
          setSelectedRoom({ ...selectedRoom, ...editRoomData } as Room);
          alert("Cập nhật thông tin phòng thành công!");
      }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if(window.confirm("Bạn có chắc muốn xóa phòng này?")) {
          const res = await dormService.deleteRoom(id);
          if(res.success) {
              fetchData();
              onUpdate();
          } else {
              alert("Lỗi: " + res.message);
          }
      }
  };

  const openDetailModal = async (room: Room) => {
      setSelectedRoom(room);
      setEditRoomData(room);
      setActiveDetailTab('residents');
      
      const [allStudents, allGuests, allAssets] = await Promise.all([
          dormService.getStudents(),
          dormService.getGuests(),
          dormService.getAssets()
      ]);
      
      setRoomStudents(allStudents.filter(s => s.roomId === room.id));
      setRoomGuests(allGuests.filter(g => g.roomId === room.id));
      setRoomAssets(allAssets.filter(a => a.roomId === room.id));
  };

  const getStatusLabel = (status: RoomStatus) => {
      switch (status) {
          case RoomStatus.AVAILABLE: return 'Còn trống';
          case RoomStatus.FULL: return 'Đã đầy';
          case RoomStatus.MAINTENANCE: return 'Bảo trì';
          default: return status;
      }
  };

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
      case RoomStatus.FULL: return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
      case RoomStatus.MAINTENANCE: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default: return 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700';
    }
  };

  const getAssetStatusConfig = (status: AssetStatus) => {
      switch (status) {
          case AssetStatus.GOOD: return { color: 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400', label: 'Tốt', icon: <CheckCircle size={14}/> };
          case AssetStatus.BROKEN: return { color: 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400', label: 'Hỏng', icon: <AlertTriangle size={14}/> };
          case AssetStatus.REPAIRING: return { color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400', label: 'Đang sửa', icon: <Wrench size={14}/> };
      }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý Phòng</h2>
            {role === Role.ADMIN && (
                <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-md transition-all">
                    <Plus size={18} /> Thêm Phòng
                </button>
            )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {rooms.map(room => (
            <div 
                key={room.id} 
                onClick={() => openDetailModal(room)}
                className={`group relative p-4 rounded-xl border-2 flex flex-col justify-between h-36 transition-all hover:shadow-lg cursor-pointer bg-white dark:bg-gray-800 ${room.status === RoomStatus.FULL ? 'border-red-100 dark:border-red-900/50' : 'border-green-100 dark:border-green-900/50'}`}
            >
            
            {role === Role.ADMIN && (
                <button 
                    type="button"
                    onClick={(e) => handleDelete(room.id, e)} 
                    className="absolute top-2 right-2 z-10 bg-white dark:bg-gray-700 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-full shadow-md border border-gray-200 dark:border-gray-600 transition-transform hover:scale-110 active:scale-95"
                    title="Xóa phòng"
                >
                    <Trash2 size={16} />
                </button>
            )}

            <div className="flex justify-between items-start mt-2">
                <div>
                    <span className="font-bold text-xl text-gray-700 dark:text-gray-200 block">{room.name}</span>
                    <span className="text-xs text-gray-400">{buildings.find(b => b.id === room.buildingId)?.name}</span>
                </div>
            </div>
            
            <div className="space-y-2 mt-auto">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(room.status as RoomStatus)}`}>
                    {getStatusLabel(room.status as RoomStatus)}
                </span>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className={`h-2.5 rounded-full ${room.status === RoomStatus.FULL ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${(room.currentCapacity / room.maxCapacity) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1"><Users size={12}/> {room.currentCapacity}/{room.maxCapacity}</span>
                    <span className="font-medium">{room.pricePerMonth.toLocaleString()} đ</span>
                </div>
            </div>
            </div>
        ))}
        </div>

        {/* Add Room Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Thêm Phòng Mới</h3>
                      <button onClick={() => setShowAddModal(false)}><X className="text-gray-400 dark:text-gray-500 hover:text-gray-600"/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Số phòng (vd: 101)" value={newRoomData.name} onChange={e => setNewRoomData({...newRoomData, name: e.target.value})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        <select required value={newRoomData.buildingId} onChange={e => setNewRoomData({...newRoomData, buildingId: e.target.value})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                             <option value="">Chọn Tòa Nhà</option>
                             {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Sức chứa</label>
                            <input type="number" value={newRoomData.maxCapacity} onChange={e => setNewRoomData({...newRoomData, maxCapacity: Number(e.target.value)})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400">Giá thuê (VNĐ)</label>
                            <input type="number" value={newRoomData.pricePerMonth} onChange={e => setNewRoomData({...newRoomData, pricePerMonth: Number(e.target.value)})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                      </div>
                      <select value={newRoomData.status} onChange={e => setNewRoomData({...newRoomData, status: e.target.value as RoomStatus})} className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                          <option value={RoomStatus.AVAILABLE}>Còn trống</option>
                          <option value={RoomStatus.MAINTENANCE}>Đang bảo trì</option>
                      </select>

                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 mt-2">Tạo Phòng</button>
                  </form>
              </div>
          </div>
        )}

        {/* Room Details Modal */}
        {selectedRoom && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl h-[650px] shadow-2xl flex flex-col overflow-hidden animate-fade-in border border-gray-200 dark:border-gray-700">
                    {/* Modal Header & Quick Stats */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    Phòng {selectedRoom.name}
                                    <span className="text-sm font-normal text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600">
                                        {buildings.find(b => b.id === selectedRoom.buildingId)?.name}
                                    </span>
                                </h2>
                            </div>
                            <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                                <X size={20} className="text-gray-500 dark:text-gray-400"/>
                            </button>
                        </div>
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
                                    <DollarSign size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Giá phòng</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{selectedRoom.pricePerMonth.toLocaleString()} đ</p>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                                    <Users size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
                                        <span>Sức chứa</span>
                                        <span>{selectedRoom.currentCapacity} / {selectedRoom.maxCapacity}</span>
                                    </p>
                                    <div className="w-full bg-gray-100 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                                        <div 
                                            className={`h-1.5 rounded-full ${selectedRoom.status === RoomStatus.FULL ? 'bg-red-500' : 'bg-green-500'}`} 
                                            style={{ width: `${(selectedRoom.currentCapacity / selectedRoom.maxCapacity) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-600 shadow-sm flex items-center gap-3">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Trạng thái</p>
                                    <p className={`font-bold text-sm ${selectedRoom.status === RoomStatus.FULL ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {getStatusLabel(selectedRoom.status)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 px-6 bg-white dark:bg-gray-800">
                        <button 
                            onClick={() => setActiveDetailTab('residents')}
                            className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'residents' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <Users size={16}/> Cư dân
                        </button>
                        <button 
                            onClick={() => setActiveDetailTab('assets')}
                            className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'assets' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <Monitor size={16}/> Tài sản
                        </button>
                        <button 
                            onClick={() => setActiveDetailTab('settings')}
                            className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeDetailTab === 'settings' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <Wrench size={16}/> Cài đặt
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-gray-800 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                        {activeDetailTab === 'residents' && (
                            <div className="space-y-6">
                                {/* Students Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                                        Sinh viên ({roomStudents.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {roomStudents.length > 0 ? (
                                            roomStudents.map(s => (
                                                <div key={s.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">SV</div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm text-gray-900 dark:text-white">{s.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex gap-3 mt-0.5">
                                                            <span>{s.university}</span>
                                                            <span>•</span>
                                                            <span>{s.phone}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs bg-white dark:bg-gray-600 px-2 py-1 rounded border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-300">
                                                        {s.gender === 'Male' ? 'Nam' : 'Nữ'}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-center">Chưa có sinh viên đăng ký.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Guests Section */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                                        Khách lưu trú ({roomGuests.length})
                                    </h3>
                                    <div className="space-y-2">
                                        {roomGuests.length > 0 ? (
                                            roomGuests.map(g => (
                                                <div key={g.id} className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-500 font-bold text-sm">KH</div>
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm text-gray-900 dark:text-white">{g.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                            Quan hệ: {g.relation}
                                                        </div>
                                                    </div>
                                                    <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                                        <div>Đến: {g.checkInDate}</div>
                                                        <div>Đi: {g.checkOutDate}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 text-center">Không có khách lưu trú.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'assets' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <span className="text-sm text-gray-600 dark:text-gray-300">Tổng giá trị tài sản:</span>
                                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                                        {roomAssets.reduce((sum, a) => sum + a.value, 0).toLocaleString()} đ
                                    </span>
                                </div>

                                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs">
                                            <tr>
                                                <th className="p-3 font-medium">Tên thiết bị</th>
                                                <th className="p-3 font-medium">Trạng thái</th>
                                                <th className="p-3 font-medium text-right">Giá trị</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                            {roomAssets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="p-6 text-center text-gray-400">Phòng chưa có tài sản.</td>
                                                </tr>
                                            ) : (
                                                roomAssets.map(a => {
                                                    const config = getAssetStatusConfig(a.status);
                                                    return (
                                                        <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                            <td className="p-3 text-gray-900 dark:text-white font-medium">{a.name}</td>
                                                            <td className="p-3">
                                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${config.color}`}>
                                                                    {config.icon} {config.label}
                                                                </span>
                                                            </td>
                                                            <td className="p-3 text-right text-gray-600 dark:text-gray-300">{a.value.toLocaleString()}</td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeDetailTab === 'settings' && (
                            <form onSubmit={handleEditSubmit} className="space-y-5 max-w-lg mx-auto py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sức chứa tối đa</label>
                                        <input 
                                            type="number" 
                                            min={selectedRoom.currentCapacity} // Can't be less than current people
                                            value={editRoomData.maxCapacity} 
                                            onChange={(e) => setEditRoomData({...editRoomData, maxCapacity: Number(e.target.value)})}
                                            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                            disabled={role !== Role.ADMIN}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Giá phòng (Tháng)</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                value={editRoomData.pricePerMonth} 
                                                onChange={(e) => setEditRoomData({...editRoomData, pricePerMonth: Number(e.target.value)})}
                                                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                                disabled={role !== Role.ADMIN}
                                            />
                                            <span className="absolute right-3 top-2.5 text-gray-400 text-sm">đ</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Trạng thái phòng</label>
                                    <select 
                                        value={editRoomData.status} 
                                        onChange={(e) => setEditRoomData({...editRoomData, status: e.target.value as RoomStatus})}
                                        className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"
                                    >
                                        <option value={RoomStatus.AVAILABLE}>Còn trống (Available)</option>
                                        <option value={RoomStatus.FULL} disabled>Đã đầy (Full) - Tự động</option>
                                        <option value={RoomStatus.MAINTENANCE}>Đang bảo trì (Maintenance)</option>
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">
                                        * Trạng thái "Đã đầy" được hệ thống tự động cập nhật dựa trên sức chứa.
                                    </p>
                                </div>

                                {role === Role.ADMIN && (
                                    <button 
                                        type="submit" 
                                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none mt-4"
                                    >
                                        <Save size={18} /> Lưu thay đổi
                                    </button>
                                )}
                            </form>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default RoomManager;
