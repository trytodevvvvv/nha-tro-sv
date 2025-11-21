
import React, { useState, useEffect } from 'react';
import { dormService } from '../services/dormService';
import { RoomStatus, Room, Role, Building, Student, Guest, Asset } from '../types';
import { User, AlertCircle, Plus, X, Trash2, Monitor, Save } from 'lucide-react';

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
      // Fetch details
      // Note: In a real app, you might want endpoints like /api/rooms/:id/students
      const allStudents = await dormService.getStudents();
      const allGuests = await dormService.getGuests();
      const allAssets = await dormService.getAssets();
      
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
      case RoomStatus.AVAILABLE: return 'bg-green-100 text-green-800 border-green-200';
      case RoomStatus.FULL: return 'bg-red-100 text-red-800 border-red-200';
      case RoomStatus.MAINTENANCE: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-white border-gray-200';
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">Quản lý Phòng</h2>
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
                className={`group relative p-4 rounded-xl border-2 flex flex-col justify-between h-36 transition-all hover:shadow-lg cursor-pointer bg-white ${room.status === RoomStatus.FULL ? 'border-red-100' : 'border-green-100'}`}
            >
            
            {role === Role.ADMIN && (
                <button 
                    type="button"
                    onClick={(e) => handleDelete(room.id, e)} 
                    className="absolute top-2 right-2 z-50 bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-full shadow-md border border-gray-200 transition-transform hover:scale-110 active:scale-95"
                    title="Xóa phòng"
                >
                    <Trash2 size={16} />
                </button>
            )}

            <div className="flex justify-between items-start mt-2">
                <div>
                    <span className="font-bold text-xl text-gray-700 block">{room.name}</span>
                    <span className="text-xs text-gray-400">{buildings.find(b => b.id === room.buildingId)?.name}</span>
                </div>
            </div>
            
            <div className="space-y-2 mt-auto">
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(room.status as RoomStatus)}`}>
                    {getStatusLabel(room.status as RoomStatus)}
                </span>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                        className={`h-2.5 rounded-full ${room.status === RoomStatus.FULL ? 'bg-red-500' : 'bg-green-500'}`} 
                        style={{ width: `${(room.currentCapacity / room.maxCapacity) * 100}%` }}
                    ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User size={12}/> {room.currentCapacity}/{room.maxCapacity}</span>
                    <span className="font-medium">{room.pricePerMonth.toLocaleString()} đ</span>
                </div>
            </div>
            </div>
        ))}
        </div>

        {/* Add Room Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                  <div className="flex justify-between mb-4">
                      <h3 className="text-xl font-bold">Thêm Phòng Mới</h3>
                      <button onClick={() => setShowAddModal(false)}><X className="text-gray-400"/></button>
                  </div>
                  <form onSubmit={handleAddSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Số phòng (vd: 101)" value={newRoomData.name} onChange={e => setNewRoomData({...newRoomData, name: e.target.value})} className="p-2 border rounded-lg w-full" />
                        <select required value={newRoomData.buildingId} onChange={e => setNewRoomData({...newRoomData, buildingId: e.target.value})} className="p-2 border rounded-lg w-full bg-white">
                             <option value="">Chọn Tòa Nhà</option>
                             {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Sức chứa</label>
                            <input type="number" value={newRoomData.maxCapacity} onChange={e => setNewRoomData({...newRoomData, maxCapacity: Number(e.target.value)})} className="p-2 border rounded-lg w-full" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-gray-500">Giá thuê (VNĐ)</label>
                            <input type="number" value={newRoomData.pricePerMonth} onChange={e => setNewRoomData({...newRoomData, pricePerMonth: Number(e.target.value)})} className="p-2 border rounded-lg w-full" />
                        </div>
                      </div>
                      <select value={newRoomData.status} onChange={e => setNewRoomData({...newRoomData, status: e.target.value as RoomStatus})} className="p-2 border rounded-lg w-full bg-white">
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
                <div className="bg-white rounded-2xl w-full max-w-2xl h-[600px] shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-200 flex justify-between items-start bg-gray-50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Phòng {selectedRoom.name}</h2>
                            <p className="text-gray-500 text-sm">Tòa nhà: {buildings.find(b => b.id === selectedRoom.buildingId)?.name}</p>
                        </div>
                        <button onClick={() => setSelectedRoom(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} className="text-gray-500"/></button>
                    </div>

                    <div className="flex border-b border-gray-200 px-6">
                        <button 
                            onClick={() => setActiveDetailTab('residents')}
                            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === 'residents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Cư dân
                        </button>
                        <button 
                            onClick={() => setActiveDetailTab('assets')}
                            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === 'assets' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Tài sản
                        </button>
                        <button 
                            onClick={() => setActiveDetailTab('settings')}
                            className={`py-4 px-2 text-sm font-medium border-b-2 transition-colors ${activeDetailTab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Cài đặt
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {activeDetailTab === 'residents' && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 flex items-center gap-2"><User size={14}/> Sinh viên</h3>
                                    <div className="space-y-2">
                                        {roomStudents.length > 0 ? (
                                            roomStudents.map(s => (
                                                <div key={s.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">SV</div>
                                                    <div>
                                                        <div className="font-medium text-sm text-gray-900">{s.name}</div>
                                                        <div className="text-xs text-gray-500">{s.university}</div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-400 italic">Chưa có sinh viên.</p>
                                        )}
                                    </div>
                                </div>
                                {/* Guest rendering similar logic */}
                            </div>
                        )}
                        {/* ... Assets and Settings tabs need similar updates to use roomAssets state ... */}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default RoomManager;
