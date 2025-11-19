
import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Bed, Users, UserCheck, Zap, Sparkles, TrendingUp } from 'lucide-react';
import { dormService } from '../services/dormService';
import StatCard from './StatCard';
import { generateDashboardReport } from '../services/geminiService';

const Dashboard: React.FC = () => {
  const stats = dormService.getDashboardStats();
  // Get dynamic revenue data derived from actual bills
  const revenueData = dormService.getRevenueData();
  
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerateReport = async () => {
    setLoadingAi(true);
    setAiReport(null);
    const report = await generateDashboardReport(stats);
    setAiReport(report);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h2>
          <p className="text-gray-500 text-sm mt-1">Theo dõi chỉ số vận hành và doanh thu phòng trọ.</p>
        </div>
        
        <button 
          onClick={handleGenerateReport}
          disabled={loadingAi}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 shadow-md shadow-indigo-200 transition-all text-sm font-medium"
        >
          {loadingAi ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {loadingAi ? 'Đang phân tích...' : 'Hỏi Gemini AI'}
        </button>
      </div>

      {/* AI Report Section */}
      {aiReport && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-6 rounded-2xl text-indigo-900 text-sm leading-relaxed shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Sparkles size={100} />
          </div>
          <div className="flex items-center gap-2 font-bold mb-3 text-indigo-700 text-base relative z-10">
            <Zap size={18} className="fill-current" />
            Phân tích từ AI
          </div>
          <div className="whitespace-pre-wrap relative z-10 font-medium text-gray-700">{aiReport}</div>
        </div>
      )}

      {/* Stats Grid - Requirement 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng số phòng" 
          value={stats.totalRooms} 
          icon={<Bed size={22} />}
          colorClass="bg-white"
        />
        <StatCard 
          title="Đã cho thuê" 
          value={stats.occupiedRooms} 
          icon={<UserCheck size={22} />}
          trend={`Tỷ lệ lấp đầy ${stats.occupancyRate}%`} 
          trendUp={stats.occupancyRate > 70}
          colorClass="bg-white"
        />
        <StatCard 
          title="Phòng trống" 
          value={stats.availableRooms} 
          icon={<Bed size={22} className="text-emerald-600" />}
          colorClass="bg-white"
          trend="Có sẵn"
          trendUp={true}
        />
        <StatCard 
          title="Tổng cư dân" 
          value={stats.totalStudents + stats.totalGuests} 
          icon={<Users size={22} />}
          trend={`+${stats.totalGuests} Khách`}
          trendUp={true}
          colorClass="bg-white"
        />
      </div>

      {/* Charts Section - Requirement 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
               <TrendingUp size={20} className="text-gray-400"/>
               Biểu đồ doanh thu (VNĐ)
             </h3>
             <div className="flex gap-2">
                <span className="text-xs flex items-center gap-1 text-gray-500"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Tiền phòng</span>
                <span className="text-xs flex items-center gap-1 text-gray-500"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Điện</span>
                <span className="text-xs flex items-center gap-1 text-gray-500"><div className="w-2 h-2 rounded-full bg-sky-500"></div> Nước</span>
             </div>
          </div>
          <div className="h-[320px] w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`} />
                  <Tooltip 
                    cursor={{fill: '#F9FAFB'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number) => value.toLocaleString() + ' đ'}
                  />
                  <Bar dataKey="roomFee" name="Tiền phòng" stackId="a" fill="#6366F1" radius={[0, 0, 4, 4]} barSize={24} />
                  <Bar dataKey="electricity" name="Tiền điện" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={24} />
                  <Bar dataKey="water" name="Tiền nước" stackId="a" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                Chưa có dữ liệu hóa đơn
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-bold text-gray-800 mb-8">Tỷ lệ lấp đầy</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
               {/* Circular Progress */}
               <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#F3F4F6"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#4F46E5"
                    strokeWidth="3"
                    strokeDasharray={`${stats.occupancyRate}, 100`}
                    strokeLinecap="round"
                  />
               </svg>
               <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-4xl font-extrabold text-gray-900">{stats.occupancyRate}%</span>
                  <span className="block text-xs font-medium text-gray-400 mt-1">CÓ NGƯỜI</span>
               </div>
            </div>
            
            <div className="mt-8 w-full space-y-4">
               <div className="flex justify-between items-center text-sm group cursor-default">
                  <span className="text-gray-500 group-hover:text-gray-700 transition-colors flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> Sinh viên
                  </span>
                  <span className="font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-md">{stats.totalStudents}</span>
               </div>
               <div className="flex justify-between items-center text-sm group cursor-default">
                  <span className="text-gray-500 group-hover:text-gray-700 transition-colors flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div> Khách
                  </span>
                  <span className="font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded-md">{stats.totalGuests}</span>
               </div>
               <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-sm">
                  <span className="text-gray-400">Trạng thái</span>
                  <span className={`font-medium ${stats.fullRooms > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {stats.fullRooms} Phòng đầy
                  </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
