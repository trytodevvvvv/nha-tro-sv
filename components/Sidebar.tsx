
import React from 'react';
import { LayoutDashboard, Users, BedDouble, UserPlus, Settings, LogOut, Building2, FileText, Monitor, Shield } from 'lucide-react';
import { Role } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: Role;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    { id: 'buildings', label: 'Quản lý Tòa nhà', icon: <Building2 size={20} /> },
    { id: 'rooms', label: 'Quản lý Phòng', icon: <BedDouble size={20} /> },
    { id: 'students', label: 'Sinh viên', icon: <Users size={20} /> },
    { id: 'guests', label: 'Khách lưu trú', icon: <UserPlus size={20} /> },
    { id: 'bills', label: 'Hóa đơn & Điện nước', icon: <FileText size={20} /> },
    { id: 'assets', label: 'Tài sản & Thiết bị', icon: <Monitor size={20} /> },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0 hidden md:flex">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <BedDouble className="text-indigo-600" />
          QL Phòng Trọ
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}

        {/* User Management Link - Admin Only */}
        {role === Role.ADMIN && (
            <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="px-4 text-xs font-bold text-gray-400 uppercase mb-2">Hệ thống</p>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === 'users'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                    <Shield size={20} />
                    Quản lý Tài khoản
                </button>
            </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 mt-1"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
