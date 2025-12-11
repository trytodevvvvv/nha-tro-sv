
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Building2, Edit, Save, X, MapPin, Search } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Building, Role } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

interface BuildingManagerProps {
    role: Role;
}

const BuildingManager: React.FC<BuildingManagerProps> = ({ role }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  const { showToast } = useToast();
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    buildingId: string | null;
  }>({ isOpen: false, buildingId: null });

  const fetchData = async () => {
      try {
          const data = await dormService.getBuildings();
          setBuildings(data);
      } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim()) return;
    await dormService.addBuilding({ name: newBuildingName });
    showToast('Đã thêm tòa nhà mới', 'success');
    fetchData();
    setNewBuildingName('');
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setConfirmModal({ isOpen: true, buildingId: id });
  };

  const confirmDelete = async () => {
      if (confirmModal.buildingId) {
          const res = await dormService.deleteBuilding(confirmModal.buildingId);
          if(res.success) {
              setBuildings(prev => prev.filter(b => b.id !== confirmModal.buildingId));
              showToast('Đã xóa tòa nhà', 'success');
              fetchData();
          } else {
              showToast(res.message || "Không thể xóa tòa nhà này.", 'error');
          }
      }
      setConfirmModal({ isOpen: false, buildingId: null });
  };

  const startEdit = (b: Building) => {
      setEditingId(b.id);
      setEditName(b.name);
  };

  const saveEdit = async (id: string) => {
      await dormService.updateBuilding(id, { name: editName });
      showToast('Cập nhật thành công', 'success');
      fetchData();
      setEditingId(null);
  };

  // Filter Logic
  const filteredBuildings = buildings.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Quản lý Tòa nhà</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Quản lý cơ sở hạ tầng khu ký túc xá.</p>
          </div>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                <input 
                    placeholder="Tìm tòa nhà..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                />
           </div>
      </div>
      
      {/* Input Glass Card */}
      {role === Role.ADMIN && (
        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl p-2 rounded-[2rem] shadow-lg border border-white/40 dark:border-gray-700/50 flex flex-col md:flex-row gap-2 max-w-2xl">
            <input 
                value={newBuildingName}
                onChange={(e) => setNewBuildingName(e.target.value)}
                placeholder="Nhập tên tòa nhà mới (vd: Tòa H3)..."
                className="flex-1 bg-transparent border-none px-6 py-4 text-gray-800 dark:text-white placeholder-gray-400 font-medium focus:ring-0 outline-none"
            />
            <button 
                onClick={handleAdd}
                disabled={!newBuildingName.trim()}
                className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-3xl font-bold hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none flex items-center gap-2"
            >
                <Plus size={20} />
                Thêm
            </button>
        </div>
      )}

      {/* Grid of Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBuildings.length > 0 ? (
              filteredBuildings.map(b => (
                  <div 
                    key={b.id} 
                    className="group relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-6 rounded-[2rem] border border-white/30 dark:border-gray-700/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 overflow-hidden"
                  >
                      {/* Decorative Gradient Blob */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none group-hover:scale-150 transition-transform duration-700"></div>

                      <div className="relative z-10 flex flex-col h-full">
                          <div className="flex items-start justify-between mb-4">
                              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-700 shadow-sm flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                                 <Building2 size={24} />
                              </div>
                              
                              {role === Role.ADMIN && (
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    {editingId === b.id ? (
                                        <>
                                            <button onClick={() => saveEdit(b.id)} className="p-2 text-green-500 bg-green-50 dark:bg-green-900/30 rounded-xl hover:scale-110 transition-transform"><Save size={16}/></button>
                                            <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 bg-gray-50 dark:bg-gray-700 rounded-xl hover:scale-110 transition-transform"><X size={16}/></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(b)} className="p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl hover:scale-110 transition-transform"><Edit size={16}/></button>
                                            <button onClick={(e) => handleDeleteClick(b.id, e)} className="p-2 text-red-500 bg-red-50 dark:bg-red-900/30 rounded-xl hover:scale-110 transition-transform"><Trash2 size={16}/></button>
                                        </>
                                    )}
                                </div>
                              )}
                          </div>

                          {editingId === b.id ? (
                              <input 
                                  value={editName} 
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="bg-white/50 dark:bg-gray-700/50 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 text-lg font-bold w-full outline-none focus:ring-2 focus:ring-indigo-500/20"
                                  autoFocus
                              />
                          ) : (
                              <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">{b.name}</h3>
                          )}
                      </div>
                  </div>
              ))
          ) : (
              <div className="col-span-full py-10 text-center text-gray-400 italic">Không tìm thấy tòa nhà nào.</div>
          )}
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmDelete}
        title="Xóa Tòa Nhà"
        message="Hành động này sẽ xóa tòa nhà khỏi hệ thống. Hãy đảm bảo tòa nhà trống trước khi xóa."
        confirmText="Xóa Tòa Nhà"
        type="danger"
      />
    </div>
  );
};

export default BuildingManager;
