
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Monitor, AlertTriangle, CheckCircle, Wrench, Trash2, X, Edit, Box, Search } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Asset, AssetStatus, Role, Room } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

interface AssetManagerProps { role: Role; }

const AssetManager: React.FC<AssetManagerProps> = ({ role }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  const { showToast } = useToast();
  
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; assetId: string | null; }>({ isOpen: false, assetId: null });
  const [formData, setFormData] = useState({ name: '', roomId: '', value: 0, status: AssetStatus.GOOD });

  useEffect(() => {
     const init = async () => {
         try {
             const [a, r] = await Promise.all([dormService.getAssets(), dormService.getRooms()]);
             setAssets(a); setRooms(r);
         } catch(e) {}
     };
     init();
  }, []);

  const handleAddNew = () => { setEditingId(null); setFormData({ name: '', roomId: '', value: 0, status: AssetStatus.GOOD }); setShowModal(true); };
  const handleEdit = (asset: Asset) => { setEditingId(asset.id); setFormData({ name: asset.name, roomId: asset.roomId, value: asset.value, status: asset.status }); setShowModal(true); };
  
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (editingId) await dormService.updateAsset(editingId, formData);
      else await dormService.addAsset(formData);
      
      showToast(editingId ? 'Đã cập nhật thông tin tài sản' : 'Đã thêm tài sản mới', 'success');
      
      const updated = await dormService.getAssets(); setAssets(updated); setShowModal(false);
  };

  const updateStatus = async (id: string, status: AssetStatus) => {
      await dormService.updateAssetStatus(id, status);
      showToast('Đã cập nhật trạng thái', 'info');
      const updated = await dormService.getAssets(); setAssets(updated);
  };

  const confirmDelete = async () => {
      if (confirmModal.assetId) {
          await dormService.deleteAsset(confirmModal.assetId);
          setAssets(prev => prev.filter(a => a.id !== confirmModal.assetId));
          showToast('Đã xóa tài sản', 'success');
      }
      setConfirmModal({isOpen: false, assetId: null});
  }

  const getStatusColor = (status: AssetStatus) => {
      switch(status) {
          case AssetStatus.GOOD: return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
          case AssetStatus.BROKEN: return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30';
          case AssetStatus.REPAIRING: return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
      }
  };

  // Filtering Logic
  const filteredAssets = assets.filter(asset => {
      const roomName = rooms.find(r => r.id === asset.roomId)?.name || '';
      const searchLower = searchTerm.toLowerCase();
      return (
          asset.name.toLowerCase().includes(searchLower) ||
          roomName.toLowerCase().includes(searchLower)
      );
  });

  return (
    <div className="space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Tài sản</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Quản lý thiết bị và vật tư.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                 <input 
                    placeholder="Tìm tên hoặc phòng..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                 />
            </div>
            <button onClick={handleAddNew} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2 whitespace-nowrap">
                <Plus size={20} /> <span className="hidden sm:inline">Thêm Mới</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.length > 0 ? (
              filteredAssets.map(asset => (
                  <div key={asset.id} className="group bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-5 rounded-[2rem] border border-white/40 dark:border-gray-700/50 shadow-sm hover:shadow-lg transition-all relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                              <Box size={24} />
                          </div>
                          <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wide border ${getStatusColor(asset.status)}`}>
                              {asset.status}
                          </span>
                      </div>
                      
                      <div className="relative z-10">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{asset.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-4">Phòng {rooms.find(r => r.id === asset.roomId)?.name || '---'}</p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-white/40 dark:border-gray-700/50 relative z-20">
                          <span className="font-black text-gray-700 dark:text-gray-300">{asset.value.toLocaleString()} đ</span>
                          
                          <div className="flex gap-1 z-20">
                                {/* Quick Action Buttons */}
                                {asset.status === AssetStatus.GOOD && <button onClick={(e) => {e.stopPropagation(); updateStatus(asset.id, AssetStatus.BROKEN)}} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-xl hover:scale-110 transition-transform hover:shadow-md cursor-pointer" title="Báo hỏng"><AlertTriangle size={16}/></button>}
                                {asset.status === AssetStatus.BROKEN && <button onClick={(e) => {e.stopPropagation(); updateStatus(asset.id, AssetStatus.REPAIRING)}} className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-500 rounded-xl hover:scale-110 transition-transform hover:shadow-md cursor-pointer" title="Đang sửa"><Wrench size={16}/></button>}
                                {asset.status === AssetStatus.REPAIRING && <button onClick={(e) => {e.stopPropagation(); updateStatus(asset.id, AssetStatus.GOOD)}} className="p-2 bg-green-50 dark:bg-green-900/30 text-green-500 rounded-xl hover:scale-110 transition-transform hover:shadow-md cursor-pointer" title="Đã sửa xong"><CheckCircle size={16}/></button>}
                                
                                <button onClick={() => handleEdit(asset)} className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl hover:scale-110 transition-transform hover:shadow-md cursor-pointer"><Edit size={16}/></button>
                                
                                {role === Role.ADMIN && <button onClick={() => setConfirmModal({isOpen: true, assetId: asset.id})} className="p-2 bg-gray-100 dark:bg-gray-700 text-red-500 rounded-xl hover:scale-110 transition-transform hover:shadow-md cursor-pointer"><Trash2 size={16}/></button>}
                          </div>
                      </div>
                  </div>
              ))
          ) : (
              <div className="col-span-full py-10 text-center text-gray-400 italic">
                  Không tìm thấy tài sản nào phù hợp.
              </div>
          )}
      </div>

      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmDelete} title="Xóa Tài Sản" message="Xác nhận xóa?" type="danger" />

      {showModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-lg animate-fade-in">
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-scale-in border border-white/20">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black dark:text-white">{editingId ? 'Sửa' : 'Thêm'} Tài sản</h3>
                      <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"><X size={20}/></button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-2">Tên thiết bị</label>
                          <input required placeholder="Nhập tên..." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold dark:text-white" />
                      </div>
                      
                      <div className="space-y-1">
                           <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-2">Vị trí phòng</label>
                           <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold dark:text-white">
                              <option value="">-- Chọn Phòng --</option>
                              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                      </div>

                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-2">Trạng thái</label>
                          <select required value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold dark:text-white">
                              <option value={AssetStatus.GOOD}>Hoạt động tốt (GOOD)</option>
                              <option value={AssetStatus.BROKEN}>Hỏng (BROKEN)</option>
                              <option value={AssetStatus.REPAIRING}>Đang bảo trì (REPAIRING)</option>
                          </select>
                      </div>
                      
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase ml-2">Giá trị (VNĐ)</label>
                          <input type="number" placeholder="0" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-none outline-none font-bold dark:text-white" />
                      </div>

                      <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg hover:bg-indigo-700 transition-all mt-2">
                          {editingId ? 'Lưu Thay Đổi' : 'Tạo Tài Sản'}
                      </button>
                  </form>
              </div>
          </div>, document.body
      )}
    </div>
  );
};

export default AssetManager;
