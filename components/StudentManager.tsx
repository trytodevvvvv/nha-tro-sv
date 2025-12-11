
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Trash2, User, MapPin, GraduationCap, X, Edit, Hash, Phone, ChevronLeft, ChevronRight, Filter, ChevronDown } from 'lucide-react';
import { dormService } from '../services/dormService';
import { Student, Role, Room } from '../types';
import ConfirmationModal from './ConfirmationModal';
import { useToast } from '../contexts/ToastContext';

interface StudentManagerProps { onUpdate: () => void; role: Role; }

const StudentManager: React.FC<StudentManagerProps> = ({ onUpdate, role }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  // Pagination & Filter State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [filterGender, setFilterGender] = useState<'ALL' | 'Male' | 'Female'>('ALL');
  const [filterUniversity, setFilterUniversity] = useState<string>('ALL');

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; studentId: string | null; }>({ isOpen: false, studentId: null });
  
  const fetchData = async (isBackground = false) => {
      if (!isBackground) setLoading(true);
      try {
          const [s, r] = await Promise.all([dormService.getStudents(), dormService.getRooms()]);
          setStudents(s);
          setRooms(r);
      } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => { fetchData(true); }, [onUpdate]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ studentCode: '', name: '', dob: '', gender: 'Male', phone: '', roomId: '', university: '' });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterGender, filterUniversity]);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation(); setConfirmModal({ isOpen: true, studentId: id });
  };

  const confirmDelete = async () => {
      if (confirmModal.studentId) {
          const result = await dormService.deleteStudent(confirmModal.studentId);
          if (result.success) {
             showToast('Đã xóa sinh viên', 'success'); fetchData(true); onUpdate();
          } else { showToast(result.message || "Xóa thất bại", 'error'); }
      }
      setConfirmModal({ isOpen: false, studentId: null });
  };

  const handleEdit = (s: Student) => {
      setEditingId(s.id);
      setFormData({ studentCode: s.studentCode || '', name: s.name, dob: s.dob, gender: s.gender, phone: s.phone, roomId: s.roomId, university: s.university || '' });
      setShowModal(true);
  };

  const handleAddNew = () => {
      setEditingId(null);
      setFormData({ studentCode: '', name: '', dob: '', gender: 'Male', phone: '', roomId: '', university: '' });
      setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let result;
    const payload = { ...formData, gender: formData.gender as 'Male'|'Female' };
    
    if (editingId) result = await dormService.updateStudent(editingId, payload);
    else result = await dormService.addStudent(payload);

    if (result.success !== false) {
        setShowModal(false); 
        setEditingId(null); 
        fetchData(true); 
        onUpdate();
        showToast(editingId ? 'Cập nhật sinh viên thành công' : 'Đã thêm sinh viên mới', 'success');
    } else { showToast(result.message || "Thao tác thất bại", 'error'); }
  };

  const getRoomName = (id: string) => rooms.find(r => r.id === id)?.name || id;

  // Derive unique universities for filter dropdown
  const uniqueUniversities = useMemo(() => {
      const unis = new Set(students.map(s => s.university).filter(Boolean));
      return Array.from(unis);
  }, [students]);

  // Advanced Filtering Logic
  const filteredStudents = students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            s.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = filterGender === 'ALL' || s.gender === filterGender;
      const matchesUni = filterUniversity === 'ALL' || s.university === filterUniversity;
      
      return matchesSearch && matchesGender && matchesUni;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
      (currentPage - 1) * itemsPerPage, 
      currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-[1600px] mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-end gap-6">
        <div>
           <h2 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">Cư dân</h2>
           <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Danh sách sinh viên đang lưu trú.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
             {/* Search */}
             <div className="relative w-full md:w-64">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                 <input 
                    placeholder="Tìm tên, mã SV..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none"
                 />
             </div>

             {/* Filters */}
             <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Filter size={16}/></div>
                    <select 
                        value={filterGender} 
                        onChange={(e) => setFilterGender(e.target.value as any)}
                        className="appearance-none pl-10 pr-8 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none cursor-pointer font-bold text-sm text-gray-700 dark:text-gray-200"
                    >
                        <option value="ALL">Tất cả giới tính</option>
                        <option value="Male">Nam</option>
                        <option value="Female">Nữ</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                </div>

                <div className="relative group flex-1 md:flex-none">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><GraduationCap size={16}/></div>
                    <select 
                        value={filterUniversity} 
                        onChange={(e) => setFilterUniversity(e.target.value)}
                        className="w-full appearance-none pl-10 pr-8 py-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl border border-white/40 dark:border-gray-700/50 shadow-sm focus:ring-2 focus:ring-indigo-500/30 outline-none cursor-pointer font-bold text-sm text-gray-700 dark:text-gray-200 max-w-[200px] truncate"
                    >
                        <option value="ALL">Tất cả trường ĐH</option>
                        {uniqueUniversities.map(uni => (
                            <option key={uni} value={uni as string}>{uni}</option>
                        ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                </div>
             </div>

             <button onClick={handleAddNew} className="w-full md:w-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-3 rounded-2xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 whitespace-nowrap">
                 <Plus size={18} /> <span className="hidden sm:inline">Thêm Mới</span>
             </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
            <div className="col-span-3">Thông tin</div>
            <div className="col-span-2">Mã SV</div>
            <div className="col-span-2">Phòng</div>
            <div className="col-span-3">Liên hệ</div>
            <div className="col-span-2 text-right">Tác vụ</div>
        </div>

        {/* Liquid Rows */}
        {paginatedStudents.length > 0 ? (
            paginatedStudents.map(s => (
                <div 
                    key={s.id} 
                    className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 p-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-[1.5rem] border border-white/40 dark:border-gray-700/30 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all duration-300 items-center"
                >
                    <div className="md:col-span-3 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${s.gender === 'Male' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'bg-pink-50 dark:bg-pink-900/20 text-pink-500'}`}>
                            <User size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 dark:text-white text-base">{s.name}</h4>
                            <p className="text-xs text-gray-500 font-medium truncate max-w-[140px]" title={s.university}>{s.university}</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                        <span className="md:hidden text-xs font-bold text-gray-400 uppercase">MSV:</span>
                        <span className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-lg text-xs font-bold font-mono">
                            {s.studentCode}
                        </span>
                    </div>

                    <div className="md:col-span-2 flex items-center gap-2">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-bold bg-white/50 dark:bg-gray-700/50 px-3 py-1.5 rounded-xl border border-white/50 dark:border-gray-600">
                            <MapPin size={14} className="text-pink-500" />
                            {getRoomName(s.roomId)}
                        </div>
                    </div>

                    <div className="md:col-span-3 text-sm text-gray-600 dark:text-gray-400 font-medium flex flex-col justify-center">
                        <div className="flex items-center gap-2"><Phone size={12}/> {s.phone}</div>
                        <div className="text-xs opacity-70 mt-0.5">{s.dob} • {s.gender === 'Male' ? 'Nam' : 'Nữ'}</div>
                    </div>

                    <div className="md:col-span-2 flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(s)} className="p-2.5 bg-white dark:bg-gray-700 text-gray-500 hover:text-indigo-600 rounded-xl hover:shadow-md transition-all"><Edit size={16}/></button>
                        {role === Role.ADMIN && (
                            <button onClick={(e) => handleDeleteClick(s.id, e)} className="p-2.5 bg-white dark:bg-gray-700 text-gray-500 hover:text-red-600 rounded-xl hover:shadow-md transition-all"><Trash2 size={16}/></button>
                        )}
                    </div>
                </div>
            ))
        ) : (
             <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Search size={24} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">Không tìm thấy sinh viên nào phù hợp bộ lọc.</p>
                <button onClick={() => {setSearchTerm(''); setFilterGender('ALL'); setFilterUniversity('ALL');}} className="mt-3 text-indigo-600 font-bold hover:underline">Xóa bộ lọc</button>
             </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 pt-4">
            <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                Trang {currentPage} / {totalPages}
            </span>
            <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      )}

      <ConfirmationModal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })} onConfirm={confirmDelete} title="Xóa Sinh viên" message="Hành động này sẽ cập nhật lại sĩ số phòng." type="danger" />

      {/* Modal */}
      {showModal && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-lg animate-fade-in">
              <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-[2.5rem] w-full max-w-xl p-8 shadow-2xl animate-scale-in border border-white/20">
                  <div className="flex justify-between mb-8">
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white">{editingId ? 'Cập nhật' : 'Thêm Sinh viên'}</h3>
                      <button onClick={() => setShowModal(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-transparent focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-gray-700 transition-colors">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Mã SV</label>
                             <input required value={formData.studentCode} onChange={e => setFormData({...formData, studentCode: e.target.value})} className="w-full bg-transparent outline-none font-bold text-gray-900 dark:text-white" placeholder="SV..." />
                         </div>
                         <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-transparent focus-within:border-indigo-500/50 focus-within:bg-white dark:focus-within:bg-gray-700 transition-colors">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Họ tên</label>
                             <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-transparent outline-none font-bold text-gray-900 dark:text-white" placeholder="Nguyễn Văn A" />
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Ngày sinh</label>
                             <input required type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full bg-transparent outline-none font-medium text-gray-900 dark:text-white" />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl">
                             <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Giới tính</label>
                             <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full bg-transparent outline-none font-medium text-gray-900 dark:text-white">
                                  <option value="Male">Nam</option>
                                  <option value="Female">Nữ</option>
                              </select>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl border border-transparent focus-within:border-indigo-500/50 transition-colors">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phòng</label>
                            <select required value={formData.roomId} onChange={e => setFormData({...formData, roomId: e.target.value})} className="w-full bg-transparent outline-none font-bold text-gray-900 dark:text-white">
                                <option value="">-- Chọn phòng --</option>
                                {rooms.map(r => (
                                    <option key={r.id} value={r.id} disabled={r.currentCapacity >= r.maxCapacity && r.id !== (editingId ? students.find(s=>s.id===editingId)?.roomId : '')}>
                                        {r.name} (Trống: {r.maxCapacity - r.currentCapacity})
                                    </option>
                                ))}
                            </select>
                      </div>

                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Trường ĐH</label>
                          <input value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} className="w-full bg-transparent outline-none font-medium text-gray-900 dark:text-white" placeholder="ĐH..." />
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-2xl">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Số điện thoại</label>
                          <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-transparent outline-none font-medium text-gray-900 dark:text-white" placeholder="09..." />
                      </div>

                      <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all mt-4">
                          {editingId ? 'Lưu thay đổi' : 'Thêm sinh viên'}
                      </button>
                  </form>
              </div>
          </div>, document.body
      )}
    </div>
  );
};

export default StudentManager;
