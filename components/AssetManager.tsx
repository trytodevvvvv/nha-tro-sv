
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Monitor, AlertTriangle, CheckCircle, Wrench, Trash2, X, Edit } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Asset, AssetStatus, Role, Room } from '../types';
import ConfirmationModal from './ConfirmationModal';

interface AssetManagerProps {
    role: Role;
}

const AssetManager: React.FC<AssetManagerProps> = ({ role }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Confirmation State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    assetId: string | null;
  }>({ isOpen: false, assetId: null });

  const [formData, setFormData] = useState({
      name: '',
      roomId: '',
      value: 0,
      status: AssetStatus.GOOD
  });

  const fetchData = async () => {
      try {
        const [a, r] = await Promise.all([dormService.getAssets(), dormService.getRooms()]);
        setAssets(a);
        setRooms(r);
      } catch (error) {
          console.error("Failed to fetch assets data", error);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({ name: '', roomId: '', value: 0, status: AssetStatus.GOOD });
      setShowModal(true);
  };

  const handleEdit = (asset: Asset, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(asset.id);
      setFormData({
          name: asset.name,
          roomId: asset.roomId,
          value: asset.value,
          status: asset.status
      });
      setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      let res;
      if (editingId) {
          res = await dormService.updateAsset(editingId, formData);
      } else {
          res = await dormService.addAsset(formData);
      }

      if (res && res.success !== false) {
          fetchData();
          setShowModal(false);
          setEditingId(null);
      } else {
          alert(res?.message || "Thao tác thất bại");
      }
  };

  const updateStatus = async (id: string, status: AssetStatus) => {
      await dormService.updateAssetStatus(id, status);
      fetchData();
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (role !== Role.ADMIN) {
          alert("Bạn không có quyền xóa tài sản.");
          return;
      }
      setConfirmModal({ isOpen: true, assetId: id });
  };

  const confirmDelete = async () => {
      if (confirmModal.assetId) {
          const res = await dormService.deleteAsset(confirmModal.assetId);
          if (res.success) {
              setAssets(prev => prev.filter(a => a.id !== confirmModal.assetId)); // Optimistic update
              fetchData(); // Sync
          } else {
              alert(res.message || "Xóa thất bại");
          }
      }
      setConfirmModal({ isOpen: false, assetId: null });
  };

  const getStatusColor = (status: AssetStatus) => {
      switch(status) {
          case AssetStatus.GOOD: return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400';
          case AssetStatus.BROKEN: return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
          case AssetStatus.REPAIRING: return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-400';
      }
  };

  const getStatusLabel = (status: AssetStatus) => {
      switch(status) {
          case AssetStatus.GOOD: return 'Hoạt động tốt';
          case AssetStatus.BROKEN: return 'Hỏng';
          case AssetStatus.REPAIRING: return 'Đang sửa';
      }
  };

  // Standard input class
  const inputClass = "p-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-gray-400 dark:placeholder-gray-500";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Tài sản & Thiết bị</h2>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Thêm Tài sản
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase">
                  <tr>
                      <th className="p-4">Tên Thiết bị</th>
                      <th className="p-4">Vị trí</th>
                      <th className="p-4">Giá trị (VNĐ)</th>
                      <th className="p-4">Tình trạng</th>
                      <th className="p-4 text-right">Hành động</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                  {assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="p-4 font-medium flex items-center gap-2 text-gray-900 dark:text-white">
                              <Monitor size={16} className="text-gray-400"/> {asset.name}
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-300">
                              Phòng {rooms.find(r => r.id === asset.roomId)?.name || 'Kho'}
                          </td>
                          <td className="p-4 text-gray-600 dark:text-gray-300">{asset.value.toLocaleString()}</td>
                          <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(asset.status)}`}>
                                  {getStatusLabel(asset.status)}
                              </span>
                          </td>
                          <td className="p-4 flex justify-end gap-2">
                              {asset.status === AssetStatus.GOOD && (
                                  <button title="Báo hỏng" onClick={() => updateStatus(asset.id, AssetStatus.BROKEN)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"><AlertTriangle size={16}/></button>
                              )}
                              {asset.status === AssetStatus.BROKEN && (
                                  <button title="Đem đi sửa" onClick={() => updateStatus(asset.id, AssetStatus.REPAIRING)} className="p-1 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded"><Wrench size={16}/></button>
                              )}
                              {asset.status === AssetStatus.REPAIRING && (
                                  <button title="Đã sửa xong" onClick={() => updateStatus(asset.id, AssetStatus.GOOD)} className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"><CheckCircle size={16}/></button>
                              )}
                              
                              <button 
                                  type="button"
                                  onClick={(e) => handleEdit(asset, e)} 
                                  className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                  title="Sửa thông tin"
                              >
                                  <Edit size={16}/>
                              </button>

                              {role === Role.ADMIN && (
                                <button 
                                    type="button"
                                    onClick={(e) => handleDeleteClick(asset.id, e)} 
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                                    title="Xóa tài sản"
                                >
                                    <Trash2 size={16}/>
                                </button>
                              )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Xóa Tài Sản"
        message="Bạn có chắc muốn xóa tài sản này khỏi hệ thống không?"
        confirmText="Xóa Tài Sản"
        type="danger"
      />

      {showModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-gray-200 dark:border-gray-700 animate-scale-in">
                  <div className="flex justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingId ? 'Cập nhật Tài sản' : 'Thêm Tài sản mới'}</h3>
                      <button onClick={() => setShowModal(false)}><X className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <input required placeholder="Tên thiết bị (vd: Điều hòa)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClass} />
                      <div className="grid grid-cols-2 gap-4">
                          <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className={inputClass}>
                              <option value="">Vị trí (Phòng)</option>
                              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          <input type="number" placeholder="Giá trị" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} className={inputClass} />
                      </div>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})} className={inputClass}>
                          <option value={AssetStatus.GOOD}>Hoạt động tốt</option>
                          <option value={AssetStatus.BROKEN}>Đã hỏng</option>
                          <option value={AssetStatus.REPAIRING}>Đang sửa chữa</option>
                      </select>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 mt-2 shadow-lg shadow-indigo-200 dark:shadow-none">
                          {editingId ? 'Lưu thay đổi' : 'Lưu thông tin'}
                      </button>
                  </form>
              </div>
          </div>,
          document.body
      )}
    </div>
  );
};

export default AssetManager;
