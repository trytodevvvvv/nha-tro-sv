
import React from 'react';
import { LayoutDashboard, Users, BedDouble, UserPlus, LogOut, Building2, FileText, Monitor, Shield, X } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: Role;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, onLogout, isOpen, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'buildings', label: 'Quản lý Tòa nhà', icon: <Building2 size={20} /> },
    { id: 'rooms', label: 'Quản lý Phòng', icon: <BedDouble size={20} /> },
    { id: 'students', label: 'Sinh viên', icon: <Users size={20} /> },
    { id: 'guests', label: 'Khách lưu trú', icon: <UserPlus size={20} /> },
    { id: 'bills', label: 'Hóa đơn & Điện nước', icon: <FileText size={20} /> },
    { id: 'assets', label: 'Tài sản & Thiết bị', icon: <Monitor size={20} /> },
  ];

  // Mobile classes vs Desktop classes
  const sidebarClasses = `
    fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm" onClick={onClose}></div>
      )}

      <aside className={sidebarClasses}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
            <BedDouble className="text-indigo-600 dark:text-indigo-400" />
            QL Phòng Trọ
          </h1>
          <button onClick={onClose} className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
             <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* User Management Link - Admin Only */}
          {role === Role.ADMIN && (
              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="px-4 text-xs font-bold text-gray-400 uppercase mb-2">Hệ thống</p>
                  <button
                      onClick={() => setActiveTab('users')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === 'users'
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100'
                      }`}
                  >
                      <Shield size={20} />
                      Quản lý Tài khoản
                  </button>
              </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 mt-1 transition-colors"
          >
            <LogOut size={20} />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
