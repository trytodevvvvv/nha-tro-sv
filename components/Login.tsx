
import React, { useState } from 'react';
import { BedDouble, Lock, User as UserIcon, ArrowRight, ShieldCheck } from 'lucide-react';
import { dormService } from '../services/dormService';
import { User } from '../types';
import { useToast } from '../contexts/ToastContext';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // Small delay to simulate network feel
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const user = await dormService.login(username, password);
      if (user) {
        showToast(`Xin chào ${user.fullName}!`, 'success');
        // Give a tiny moment for the toast to render before state change might cause re-renders
        setTimeout(() => {
             onLogin(user);
        }, 100);
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không đúng.');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      
      {/* Dynamic Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-400/30 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-400/30 dark:bg-indigo-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[500px] h-[500px] bg-pink-400/30 dark:bg-pink-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Main Card */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 dark:border-gray-700 overflow-hidden">
          
          {/* Header Section */}
          <div className="pt-10 pb-6 px-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-6 transform transition-transform hover:scale-110 duration-300">
              <BedDouble className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
              Chào mừng trở lại
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Đăng nhập để quản lý hệ thống phòng trọ
            </p>
          </div>

          <div className="p-8 pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Error Message */}
              <div className={`transition-all duration-300 ease-in-out overflow-hidden ${error ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3 flex items-center gap-3 text-sm text-red-600 dark:text-red-400 font-medium">
                  <ShieldCheck size={18} className="flex-shrink-0" />
                  {error}
                </div>
              </div>

              <div className="space-y-4">
                <div className="group relative">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Tên đăng nhập</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-gray-700 rounded-xl outline-none transition-all duration-200 text-gray-900 dark:text-white font-medium placeholder-gray-400"
                      placeholder="admin"
                    />
                  </div>
                </div>

                <div className="group relative">
                  <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1 mb-1 block">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                    <input 
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-indigo-500/50 focus:bg-white dark:focus:bg-gray-700 rounded-xl outline-none transition-all duration-200 text-gray-900 dark:text-white font-medium placeholder-gray-400"
                      placeholder="****"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="group w-full relative overflow-hidden bg-gray-900 dark:bg-indigo-600 hover:bg-gray-800 dark:hover:bg-indigo-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-2"
              >
                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Quên mật khẩu? Vui lòng liên hệ <span className="text-indigo-600 dark:text-indigo-400 font-bold cursor-pointer hover:underline">Quản trị viên</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
