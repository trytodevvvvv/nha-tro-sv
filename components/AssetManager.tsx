import React, { useState, useEffect } from 'react';
import { Plus, Monitor, AlertTriangle, CheckCircle, Wrench, Trash2, X, Edit } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Asset, AssetStatus, Role, Room } from '../types';

interface AssetManagerProps {
    role: Role;
}

const AssetManager: React.FC<AssetManagerProps> = ({ role }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
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
      if (editingId) {
          await dormService.updateAsset(editingId, formData);
      } else {
          await dormService.addAsset(formData);
      }
      fetchData();
      setShowModal(false);
      setEditingId(null);
  };

  const updateStatus = async (id: string, status: AssetStatus) => {
      await dormService.updateAssetStatus(id, status);
      fetchData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if(window.confirm("Xóa tài sản này khỏi hệ thống?")) {
        await dormService.deleteAsset(id);
        fetchData();
      }
  };

  const getStatusColor = (status: AssetStatus) => {
      switch(status) {
          case AssetStatus.GOOD: return 'text-green-600 bg-green-50';
          case AssetStatus.BROKEN: return 'text-red-600 bg-red-50';
          case AssetStatus.REPAIRING: return 'text-orange-600 bg-orange-50';
      }
  };

  const getStatusLabel = (status: AssetStatus) => {
      switch(status) {
          case AssetStatus.GOOD: return 'Hoạt động tốt';
          case AssetStatus.BROKEN: return 'Hỏng';
          case AssetStatus.REPAIRING: return 'Đang sửa';
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Tài sản & Thiết bị</h2>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Thêm Tài sản
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <tr>
                      <th className="p-4">Tên Thiết bị</th>
                      <th className="p-4">Vị trí</th>
                      <th className="p-4">Giá trị (VNĐ)</th>
                      <th className="p-4">Tình trạng</th>
                      <th className="p-4 text-right">Hành động</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                  {assets.map(asset => (
                      <tr key={asset.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium flex items-center gap-2">
                              <Monitor size={16} className="text-gray-400"/> {asset.name}
                          </td>
                          <td className="p-4 text-gray-600">
                              Phòng {rooms.find(r => r.id === asset.roomId)?.name || 'Kho'}
                          </td>
                          <td className="p-4 text-gray-600">{asset.value.toLocaleString()}</td>
                          <td className="p-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(asset.status)}`}>
                                  {getStatusLabel(asset.status)}
                              </span>
                          </td>
                          <td className="p-4 flex justify-end gap-2">
                              {asset.status === AssetStatus.GOOD && (
                                  <button title="Báo hỏng" onClick={() => updateStatus(asset.id, AssetStatus.BROKEN)} className="p-1 text-red-500 hover:bg-red-50 rounded"><AlertTriangle size={16}/></button>
                              )}
                              {asset.status === AssetStatus.BROKEN && (
                                  <button title="Đem đi sửa" onClick={() => updateStatus(asset.id, AssetStatus.REPAIRING)} className="p-1 text-orange-500 hover:bg-orange-50 rounded"><Wrench size={16}/></button>
                              )}
                              {asset.status === AssetStatus.REPAIRING && (
                                  <button title="Đã sửa xong" onClick={() => updateStatus(asset.id, AssetStatus.GOOD)} className="p-1 text-green-500 hover:bg-green-50 rounded"><CheckCircle size={16}/></button>
                              )}
                              
                              <button 
                                  type="button"
                                  onClick={(e) => handleEdit(asset, e)} 
                                  className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                  title="Sửa thông tin"
                              >
                                  <Edit size={16}/>
                              </button>

                              {role === Role.ADMIN && (
                                <button 
                                    type="button"
                                    onClick={(e) => handleDelete(asset.id, e)} 
                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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

      {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                  <div className="flex justify-between mb-4">
                      <h3 className="text-xl font-bold">{editingId ? 'Cập nhật Tài sản' : 'Thêm Tài sản mới'}</h3>
                      <button onClick={() => setShowModal(false)}><X className="text-gray-400"/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <input required placeholder="Tên thiết bị (vd: Điều hòa)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="p-2 border rounded-lg w-full" />
                      <div className="grid grid-cols-2 gap-4">
                          <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className="p-2 border rounded-lg w-full bg-white">
                              <option value="">Vị trí (Phòng)</option>
                              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                          <input type="number" placeholder="Giá trị" value={formData.value} onChange={e => setFormData({...formData, value: Number(e.target.value)})} className="p-2 border rounded-lg w-full" />
                      </div>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AssetStatus})} className="p-2 border rounded-lg w-full bg-white">
                          <option value={AssetStatus.GOOD}>Hoạt động tốt</option>
                          <option value={AssetStatus.BROKEN}>Đã hỏng</option>
                          <option value={AssetStatus.REPAIRING}>Đang sửa chữa</option>
                      </select>
                      <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 mt-2">
                          {editingId ? 'Lưu thay đổi' : 'Lưu thông tin'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AssetManager;