
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Building2, Edit, Save, X } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Building, Role } from '../types';

interface BuildingManagerProps {
    role: Role;
}

const BuildingManager: React.FC<BuildingManagerProps> = ({ role }) => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [newBuildingName, setNewBuildingName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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
    await dormService.addBuilding({ name: newBuildingName }); // assuming backend accepts object
    fetchData();
    setNewBuildingName('');
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if(window.confirm("Xóa tòa nhà này?")) {
          const res = await dormService.deleteBuilding(id);
          if(res.success) {
              setBuildings(prev => prev.filter(b => b.id !== id)); // Optimistic update
              fetchData();
          } else {
              alert(res.message || "Không thể xóa tòa nhà này (Có thể còn phòng).");
          }
      }
  };

  const startEdit = (b: Building) => {
      setEditingId(b.id);
      setEditName(b.name);
  };

  const saveEdit = async (id: string) => {
      await dormService.updateBuilding(id, { name: editName });
      fetchData();
      setEditingId(null);
  };

  // Standard input class
  const inputClass = "flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500";
  const editInputClass = "border border-gray-300 dark:border-gray-600 rounded px-2 py-1 outline-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Quản lý Tòa nhà</h2>
      
      {role === Role.ADMIN && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleAdd} className="flex gap-3 mb-6">
                <input 
                    value={newBuildingName}
                    onChange={(e) => setNewBuildingName(e.target.value)}
                    placeholder="Nhập tên tòa nhà (vd: Tòa A)"
                    className={inputClass}
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700 transition-colors">
                    <Plus size={18} /> Thêm Tòa
                </button>
            </form>
        </div>
      )}

      <div className="space-y-3">
          {buildings.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
                          <Building2 size={20} className="text-gray-500 dark:text-gray-400" />
                      </div>
                      {editingId === b.id ? (
                          <input 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)}
                              className={editInputClass}
                              autoFocus
                          />
                      ) : (
                          <div>
                              <span className="font-medium text-gray-800 dark:text-white block">{b.name}</span>
                              <span className="text-xs text-gray-400">ID: {b.id}</span>
                          </div>
                      )}
                  </div>

                  {role === Role.ADMIN && (
                      <div className="flex items-center gap-2">
                          {editingId === b.id ? (
                              <>
                                  <button onClick={() => saveEdit(b.id)} className="text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 p-2 rounded"><Save size={18}/></button>
                                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded"><X size={18}/></button>
                              </>
                          ) : (
                              <>
                                  <button type="button" onClick={() => startEdit(b)} className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-2">
                                      <Edit size={18} />
                                  </button>
                                  <button type="button" onClick={(e) => handleDelete(b.id, e)} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-2">
                                      <Trash2 size={18} />
                                  </button>
                              </>
                          )}
                      </div>
                  )}
              </div>
          ))}
      </div>
    </div>
  );
};

export default BuildingManager;
