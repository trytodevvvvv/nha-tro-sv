
import React, { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataVersion, setDataVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
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
      updateNotifications();
  }, [dataVersion]);

  const updateNotifications = () => {
      setNotifications(dormService.getNotifications());
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('session_user', JSON.stringify(user));
  };

  const handleLogout = () => {
      setCurrentUser(null);
      localStorage.removeItem('session_user');
      setActiveTab('dashboard');
  };

  const handleDataUpdate = () => {
    setDataVersion(prev => prev + 1);
    updateNotifications();
  };

  // If not logged in, show Login screen
  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={dataVersion} />;
      case 'rooms':
        return <RoomManager key={dataVersion} onUpdate={handleDataUpdate} role={currentUser.role} />;
      case 'students':
        return <StudentManager key={dataVersion} onUpdate={handleDataUpdate} role={currentUser.role} />;
      case 'buildings':
        return <BuildingManager key={dataVersion} role={currentUser.role} />;
      case 'bills':
        return <BillManager key={dataVersion} role={currentUser.role} onUpdate={handleDataUpdate} />;
      case 'assets':
        return <AssetManager key={dataVersion} role={currentUser.role} />;
      case 'users':
        return <UserManager key={dataVersion} currentUser={currentUser} />;
      default:
        return <Dashboard key={dataVersion} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => { setActiveTab(tab); setIsMobileMenuOpen(false); }} 
        role={currentUser.role} 
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 flex flex-col max-w-[100vw] overflow-x-hidden">
        
        {/* Mobile Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center md:hidden sticky top-0 z-30">
          <h1 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">QL Phòng Trọ</h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200">
             <Menu size={24}/>
          </button>
        </div>

        {/* Top Bar (Desktop) */}
        <header className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 h-16 px-6 flex items-center justify-between sticky top-0 z-20 hidden md:flex transition-colors duration-200">
          <div>
          </div> 

          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button 
                onClick={toggleDarkMode} 
                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                title={darkMode ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Notification Bell */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors outline-none"
                >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse"></span>
                )}
                </button>
                
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-30 animate-fade-in origin-top-right">
                        <div className="p-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200 text-sm">Thông báo</h3>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{notifications.length} chưa đọc</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">
                                    <CheckCircle size={24} className="mx-auto mb-2 opacity-30"/>
                                    Không có thông báo mới
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${notif.type === 'danger' ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}
                                            onClick={() => {
                                                setActiveTab('bills');
                                                setShowNotifications(false);
                                            }}
                                        >
                                            <div className={`mt-1 p-1 rounded-full flex-shrink-0 ${notif.type === 'danger' ? 'text-red-500 bg-red-100 dark:bg-red-900/20' : 'text-orange-500 bg-orange-100 dark:bg-orange-900/20'}`}>
                                                <AlertCircle size={14} />
                                            </div>
                                            <div>
                                                <p className={`text-sm ${notif.type === 'danger' ? 'text-red-700 dark:text-red-400 font-medium' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notif.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{currentUser.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser.role === Role.ADMIN ? 'Quản trị viên' : 'Nhân viên'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-gray-800">
                {currentUser.role === Role.ADMIN ? <Shield size={18}/> : <UserIcon size={18}/>}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div 
            className="flex-1 p-4 md:p-8 mx-auto w-full overflow-y-auto scroll-smooth"
            onClick={() => setShowNotifications(false)} 
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
