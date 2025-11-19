import React, { useState } from 'react';
import { Plus, Trash2, Building2, Edit, Save, X } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Building, Role } from '../types';

interface BuildingManagerProps {
    role: Role;
}

const BuildingManager: React.FC<BuildingManagerProps> = ({ role }) => {
  const [buildings, setBuildings] = useState<Building[]>(dormService.getBuildings());
  const [newBuildingName, setNewBuildingName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim()) return;
    dormService.addBuilding(newBuildingName);
    setBuildings(dormService.getBuildings());
    setNewBuildingName('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation(); // Quan trọng: ngăn click lan tỏa
      
      if(window.confirm("Xóa tòa nhà này? Lưu ý: Chỉ xóa được tòa nhà không còn phòng.")) {
          const res = dormService.deleteBuilding(id);
          if(res.success) {
              setBuildings(dormService.getBuildings());
          } else {
              alert(res.message);
          }
      }
  };

  const startEdit = (b: Building) => {
      setEditingId(b.id);
      setEditName(b.name);
  };

  const saveEdit = (id: string) => {
      const res = dormService.updateBuilding(id, editName);
      if(res.success) {
          setBuildings(dormService.getBuildings());
          setEditingId(null);
      } else {
          alert(res.message);
      }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">Quản lý Tòa nhà</h2>
      
      {role === Role.ADMIN && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <form onSubmit={handleAdd} className="flex gap-3 mb-6">
                <input 
                    value={newBuildingName}
                    onChange={(e) => setNewBuildingName(e.target.value)}
                    placeholder="Nhập tên tòa nhà (vd: Tòa A)"
                    className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium hover:bg-indigo-700">
                    <Plus size={18} /> Thêm Tòa
                </button>
            </form>
        </div>
      )}

      <div className="space-y-3">
          {buildings.map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-3 flex-1">
                      <div className="p-2 bg-gray-50 rounded-md border border-gray-200">
                          <Building2 size={20} className="text-gray-500" />
                      </div>
                      
                      {editingId === b.id ? (
                          <input 
                              value={editName} 
                              onChange={(e) => setEditName(e.target.value)}
                              className="border rounded px-2 py-1 outline-indigo-500"
                              autoFocus
                          />
                      ) : (
                          <div>
                              <span className="font-medium text-gray-800 block">{b.name}</span>
                              <span className="text-xs text-gray-400">ID: {b.id}</span>
                          </div>
                      )}
                  </div>

                  {role === Role.ADMIN && (
                      <div className="flex items-center gap-2">
                          {editingId === b.id ? (
                              <>
                                  <button onClick={() => saveEdit(b.id)} className="text-green-600 hover:bg-green-50 p-2 rounded"><Save size={18}/></button>
                                  <button onClick={() => setEditingId(null)} className="text-gray-400 hover:bg-gray-50 p-2 rounded"><X size={18}/></button>
                              </>
                          ) : (
                              <>
                                  <button type="button" onClick={() => startEdit(b)} className="text-gray-400 hover:text-indigo-600 p-2">
                                      <Edit size={18} />
                                  </button>
                                  <button type="button" onClick={(e) => handleDelete(b.id, e)} className="text-gray-400 hover:text-red-600 p-2">
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