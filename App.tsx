
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GuestManager from './components/GuestManager';
import RoomManager from './components/RoomManager';
import StudentManager from './components/StudentManager';
import BuildingManager from './components/BuildingManager';
import BillManager from './components/BillManager';
import AssetManager from './components/AssetManager';
import UserManager from './components/UserManager';
import Login from './components/Login';
import { Bell, Shield, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { Role, User, Notification } from './types';
import { dormService } from './services/dormService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dataVersion, setDataVersion] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Check for session on load
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
      case 'guests':
        return <GuestManager key={dataVersion} onUpdate={handleDataUpdate} role={currentUser.role} />;
      case 'rooms':
        return <RoomManager key={dataVersion} onUpdate={handleDataUpdate} role={currentUser.role} />;
      case 'students':
        return <StudentManager key={dataVersion} onUpdate={handleDataUpdate} role={currentUser.role} />;
      case 'buildings':
        return <BuildingManager key={dataVersion} role={currentUser.role} />;
      case 'bills':
        return <BillManager key={dataVersion} role={currentUser.role} />;
      case 'assets':
        return <AssetManager key={dataVersion} role={currentUser.role} />;
      case 'users':
        return <UserManager key={dataVersion} currentUser={currentUser} />;
      default:
        return <Dashboard key={dataVersion} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f3f4f6]">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        role={currentUser.role} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 flex flex-col max-w-[100vw] overflow-x-hidden">
        {/* Mobile Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center md:hidden">
          <h1 className="text-lg font-bold text-indigo-600">QL Phòng Trọ</h1>
          <button className="p-2 rounded-full bg-gray-100 text-gray-600">
             <span className="sr-only">Menu</span>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </div>

        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 h-16 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="text-sm text-gray-500 font-medium">
             Năm học 2023-2024
          </div>
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors outline-none"
                >
                <Bell size={20} />
                {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
                )}
                </button>
                
                {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-30 animate-fade-in">
                        <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-700 text-sm">Thông báo</h3>
                            <span className="text-xs text-gray-500">{notifications.length} chưa đọc</span>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-4 text-center text-gray-400 text-sm">
                                    <CheckCircle size={24} className="mx-auto mb-2 opacity-30"/>
                                    Không có thông báo mới
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(notif => (
                                        <div 
                                            key={notif.id} 
                                            className={`p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors cursor-pointer ${notif.type === 'danger' ? 'bg-red-50/30' : ''}`}
                                            onClick={() => {
                                                setActiveTab('bills');
                                                setShowNotifications(false);
                                            }}
                                        >
                                            <div className={`mt-1 p-1 rounded-full flex-shrink-0 ${notif.type === 'danger' ? 'text-red-500 bg-red-100' : 'text-orange-500 bg-orange-100'}`}>
                                                <AlertCircle size={14} />
                                            </div>
                                            <div>
                                                <p className={`text-sm ${notif.type === 'danger' ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">{notif.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900">{currentUser.fullName}</p>
                <p className="text-xs text-gray-500">{currentUser.role === Role.ADMIN ? 'Quản trị viên' : 'Nhân viên'}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                {currentUser.role === Role.ADMIN ? <Shield size={18}/> : <UserIcon size={18}/>}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div 
            className="flex-1 p-6 md:p-8 mx-auto w-full overflow-y-auto"
            onClick={() => setShowNotifications(false)} 
        >
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
