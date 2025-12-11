
import React from 'react';
import { LayoutDashboard, Users, BedDouble, LogOut, Building2, FileText, Monitor, Shield, X } from 'lucide-react';
import { Role } from '../types';
import { NavLink } from 'react-router-dom';

interface SidebarProps {
  role: Role;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, onLogout, isOpen, onClose }) => {
  const menuItems = [
    { path: '/', label: 'Tổng quan', icon: <LayoutDashboard size={20} />, end: true },
    { path: '/buildings', label: 'Tòa nhà', icon: <Building2 size={20} /> },
    { path: '/rooms', label: 'Phòng & Giường', icon: <BedDouble size={20} /> },
    { path: '/students', label: 'Cư dân', icon: <Users size={20} /> },
    { path: '/bills', label: 'Tài chính', icon: <FileText size={20} /> },
    { path: '/assets', label: 'Tài sản', icon: <Monitor size={20} /> },
  ];

  // Optimization: Reduced blur radius (xl -> lg) and added gpu-transform logic implicitly via standard tailwind transforms
  const sidebarClasses = `
    fixed inset-y-4 left-4 z-40 w-64 
    bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border border-white/40 dark:border-gray-700/50 
    rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.12)]
    flex flex-col h-[calc(100vh-2rem)] transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
    md:translate-x-0 
    ${isOpen ? 'translate-x-0' : '-translate-x-[120%] md:translate-x-0'}
  `;

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => `
    w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 relative overflow-hidden group
    ${isActive
      ? 'text-white shadow-lg shadow-indigo-500/30'
      : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50 hover:text-indigo-600 dark:hover:text-indigo-300'
    }
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" onClick={onClose}></div>
      )}

      <aside className={sidebarClasses}>
        {/* Logo Area */}
        <div className="p-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <BedDouble size={22} />
             </div>
             <div>
                <h1 className="text-lg font-black text-gray-800 dark:text-white leading-tight tracking-tight whitespace-nowrap">QL Nhà Trọ</h1>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sinh Viên</p>
             </div>
          </div>
          <button onClick={onClose} className="md:hidden p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
             <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide py-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={onClose}
              className={getNavLinkClass}
            >
              {({ isActive }) => (
                <>
                   {isActive && (
                       <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl -z-10 animate-fade-in"></div>
                   )}
                   <span className="relative z-10">{item.icon}</span>
                   <span className="relative z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* User Management Link - Admin Only */}
          {role === Role.ADMIN && (
              <div className="pt-6 mt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                  <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 opacity-70">Admin Zone</p>
                  <NavLink
                      to="/users"
                      onClick={onClose}
                      className={getNavLinkClass}
                  >
                      {({ isActive }) => (
                        <>
                           {isActive && (
                               <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl -z-10 animate-fade-in"></div>
                           )}
                           <span className="relative z-10"><Shield size={20} /></span>
                           <span className="relative z-10">Hệ thống</span>
                        </>
                      )}
                  </NavLink>
              </div>
          )}
        </nav>

        {/* Footer / Logout */}
        <div className="p-4 mt-auto">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:shadow-lg hover:shadow-red-500/10 group"
          >
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/40 group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-colors">
                <LogOut size={16} className="text-red-500 group-hover:scale-110 transition-transform"/>
            </div>
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
