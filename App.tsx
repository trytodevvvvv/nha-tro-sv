
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import RoomManager from './components/RoomManager';
import StudentManager from './components/StudentManager';
import BuildingManager from './components/BuildingManager';
import BillManager from './components/BillManager';
import AssetManager from './components/AssetManager';
import UserManager from './components/UserManager';
import Login from './components/Login';
import { Bell, Shield, User as UserIcon, AlertCircle, CheckCircle, Moon, Sun, Menu } from 'lucide-react';
import { Role, User, Notification } from './types';
import { dormService } from './services/dormService';

const App: React.FC = () => {
  const [dataVersion, setDataVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  
  // Dark mode state with safe initialization
  const [darkMode, setDarkMode] = useState(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('theme_mode');
          return saved === 'dark';
      }
      return false;
  });

  useEffect(() => {
      const root = window.document.documentElement;
      if (darkMode) {
          root.classList.add('dark');
          localStorage.setItem('theme_mode', 'dark');
      } else {
          root.classList.remove('dark');
          localStorage.setItem('theme_mode', 'light');
      }
  }, [darkMode]);

  const toggleDarkMode = () => {
      setDarkMode(prev => !prev);
  };

  // Check for session
  useEffect(() => {
      const savedUser = localStorage.getItem('session_user');
      if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
      }
  }, []);

  // Update notifications whenever dataVersion changes
  useEffect(() => {
      if (currentUser) {
          updateNotifications();
      }
  }, [dataVersion, currentUser]);

  const updateNotifications = async () => {
      try {
          const notifs = await dormService.getNotifications();
          setNotifications(notifs);
      } catch (error) {
          console.error("Failed to update notifications", error);
      }
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
      setCurrentUser(null);
      localStorage.removeItem('session_user');
      navigate('/');
  };

  const handleDataUpdate = () => {
    setDataVersion(prev => prev + 1);
    // updateNotifications is triggered by useEffect on dataVersion
  };

  // If not logged in, show Login screen
  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F2F4F8] dark:bg-[#0F1115] text-gray-900 dark:text-gray-100 transition-colors duration-300 overflow-hidden relative font-sans selection:bg-indigo-500/30">
      
      {/* --- OPTIMIZED GLOBAL LIQUID BACKGROUND BLOBS --- */}
      {/* Added 'gpu' class (translateZ(0)) and will-change-transform to force GPU composition */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-purple-200/30 dark:bg-purple-900/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] animate-blob opacity-50 will-change-transform gpu"></div>
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] animate-blob animation-delay-2000 opacity-50 will-change-transform gpu"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[45vw] h-[45vw] bg-pink-200/30 dark:bg-pink-900/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[60px] animate-blob animation-delay-4000 opacity-50 will-change-transform gpu"></div>
      </div>

      <Sidebar 
        role={currentUser.role} 
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 flex flex-col max-w-[100vw] h-screen overflow-hidden relative z-10 md:pl-[280px]">
        
        {/* Mobile Header */}
        <div className="md:hidden p-4 flex justify-between items-center z-30 relative">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                <span className="font-bold">D</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-3 rounded-2xl bg-white/70 dark:bg-gray-800/60 backdrop-blur-md shadow-sm border border-white/40 dark:border-gray-700/50 text-gray-600 dark:text-gray-200">
             <Menu size={20}/>
          </button>
        </div>

        {/* Top Bar (Desktop) */}
        <header className="h-20 px-8 flex items-center justify-between z-20 hidden md:flex">
          <div>
              {/* Breadcrumb or Title could go here */}
          </div> 

          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button 
                onClick={toggleDarkMode} 
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/40 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm"
                title={darkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
            >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/40 dark:border-gray-700/50 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-sm outline-none"
                >
                <Bell size={18} />
                {notifications.length > 0 && (
                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse"></span>
                )}
                </button>
                
                {showNotifications && (
                    <div className="absolute right-0 mt-4 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-gray-700 overflow-hidden z-30 animate-scale-in origin-top-right">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white text-sm">Thông báo</h3>
                            <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{notifications.length} mới</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">
                                    <CheckCircle size={32} className="mx-auto mb-3 opacity-20"/>
                                    Tất cả đã được cập nhật
                                </div>
                            ) : (
                                <div className="p-2 space-y-1">
                                    {notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className="p-3 rounded-2xl flex items-start gap-3 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group"
                                            onClick={() => {
                                                if(notif.type === 'danger' || notif.type === 'warning') navigate('/bills');
                                                else if(notif.message.includes('bảo trì')) navigate('/rooms');
                                                else if(notif.message.includes('hỏng')) navigate('/assets');
                                                setShowNotifications(false);
                                            }}
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.type === 'danger' ? 'bg-red-500' : notif.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                                            <div>
                                                <p className="text-sm text-gray-700 dark:text-gray-200 font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {notif.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-wide">{notif.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200/50 dark:border-gray-700/50">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{currentUser.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{currentUser.role === Role.ADMIN ? 'Admin' : 'Staff'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20">
                 <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                    {currentUser.role === Role.ADMIN ? <Shield size={16} className="text-indigo-500"/> : <UserIcon size={16} className="text-purple-500"/>}
                 </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area - Added will-change-scroll for scroll performance */}
        <div 
            className="flex-1 px-4 md:px-8 pb-8 overflow-y-auto scrollbar-hide scroll-smooth will-change-scroll"
            onClick={() => setShowNotifications(false)} 
        >
          <Routes>
            <Route path="/" element={<Dashboard key={dataVersion} />} />
            <Route path="/rooms" element={<RoomManager key={dataVersion} onUpdate={handleDataUpdate} role={currentUser.role} />} />
            <Route path="/students" element={<StudentManager key={dataVersion} onUpdate={handleDataUpdate} role={currentUser.role} />} />
            <Route path="/buildings" element={<BuildingManager key={dataVersion} role={currentUser.role} />} />
            <Route path="/bills" element={<BillManager key={dataVersion} role={currentUser.role} onUpdate={handleDataUpdate} />} />
            <Route path="/assets" element={<AssetManager key={dataVersion} role={currentUser.role} />} />
            <Route path="/users" element={<UserManager key={dataVersion} currentUser={currentUser} />} />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
