
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Bed, Users, Sparkles, TrendingUp, DollarSign, AlertTriangle, Wrench, Calendar, PieChart, CheckCircle2 } from 'lucide-react';
import { dormService } from '../services/dormService';
import StatCard from './StatCard';
import { generateDashboardReport } from '../services/geminiService';
import { DashboardStats, MonthlyRevenue, Room, Bill } from '../types';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State đảm bảo container đã có kích thước thật trước khi vẽ biểu đồ
  const [isChartReady, setIsChartReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
        try {
            const [s, r, rm, b] = await Promise.all([
                dormService.getDashboardStats(),
                dormService.getRevenueData(),
                dormService.getRooms(),
                dormService.getBills()
            ]);
            if(mounted) {
                setStats(s);
                setRevenueData(r);
                setRooms(rm);
                setBills(b);
                setLoading(false);
                
                // CRITICAL FIX: Đợi 100ms để DOM layout ổn định kích thước rồi mới cho phép vẽ biểu đồ
                // Điều này khắc phục triệt để lỗi width(-1)
                setTimeout(() => {
                    if (mounted) setIsChartReady(true);
                }, 100);
            }
        } catch (e) {
            console.error("Dashboard fetch error", e);
            if(mounted) setLoading(false);
        }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerateReport = async () => {
    if (!stats) return;
    setLoadingAi(true);
    setAiReport(null);
    const report = await generateDashboardReport(stats);
    setAiReport(report);
    setLoadingAi(false);
  };

  if (loading && !stats) return (
    <div className="min-h-[500px] flex flex-col items-center justify-center text-gray-400">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p>Đang tải dữ liệu...</p>
    </div>
  );
  if (!stats) return null;

  const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const unpaidBillsCount = bills.filter(b => b.status === 'UNPAID').length;
  const totalRevenue = bills.reduce((acc, curr) => acc + (curr.status === 'PAID' ? curr.totalAmount : 0), 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl text-sm z-50 animate-fade-in">
          <p className="font-bold text-gray-700 dark:text-gray-200 mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">Tháng {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                <span className="text-gray-500 dark:text-gray-400">{entry.name}</span>
              </div>
              <span className="font-medium text-gray-900 dark:text-white">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between font-bold">
              <span className="text-gray-600 dark:text-gray-300">Tổng doanh thu</span>
              <span className="text-indigo-600 dark:text-indigo-400">{total.toLocaleString()} đ</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10 max-w-[1600px] mx-auto">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Tổng quan hệ thống</h1>
           <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mt-1">
              <Calendar size={14} />
              <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
           </div>
        </div>
        <div>
             <button 
                onClick={handleGenerateReport}
                disabled={loadingAi}
                className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loadingAi ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                ) : (
                  <Sparkles size={18} className="text-yellow-300 group-hover:rotate-12 transition-transform"/>
                )}
                <span>{loadingAi ? 'AI đang phân tích...' : 'Phân tích & Báo cáo AI'}</span>
             </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard 
          title="Doanh thu thực tế" 
          value={`${(totalRevenue / 1000000).toFixed(1)}M`}
          icon={<DollarSign size={22} />}
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
          trend="Tháng này"
          trendUp={true}
        />
        <StatCard 
          title="Sinh viên lưu trú" 
          value={stats.totalStudents} 
          icon={<Users size={22} />}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"
          trend="Đang hoạt động"
          trendUp={true}
        />
        <StatCard 
          title="Phòng trống" 
          value={stats.availableRooms} 
          icon={<Bed size={22} />}
          colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400"
          trend={`${stats.fullRooms} phòng đầy`}
          trendUp={false}
        />
        <StatCard 
          title="Hiệu suất lấp đầy" 
          value={`${stats.occupancyRate}%`}
          icon={<PieChart size={22} />}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400"
          trend="Tổng thể"
          trendUp={stats.occupancyRate > 80}
        />
      </div>

      {/* 3. AI INSIGHTS */}
      {aiReport && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-6 relative animate-fade-in-up">
           <div className="flex gap-4">
              <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm h-fit">
                <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
              <div className="flex-1">
                 <h3 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                    Đề xuất tối ưu hóa từ AI
                    <span className="text-[10px] bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 px-2 py-0.5 rounded-full uppercase font-bold">Beta</span>
                 </h3>
                 <div className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line leading-relaxed font-medium">
                    {aiReport}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 4. MAIN ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: REVENUE CHART */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
           <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-lg">
                    <TrendingUp size={20} className="text-indigo-500"/>
                    Biểu đồ Doanh thu
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi thu nhập từ tiền phòng và dịch vụ</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-1 rounded-lg">
                 <button className="px-3 py-1 bg-white dark:bg-gray-600 text-xs font-bold rounded-md shadow-sm text-gray-800 dark:text-white">6 Tháng</button>
                 <button className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors">Năm nay</button>
              </div>
           </div>
           
           {/* Chart Container - FIX TRIỆT ĐỂ: Gán cứng style width/height */}
           <div className="w-full bg-gray-50/50 dark:bg-gray-900/20 rounded-xl p-2 relative" style={{ width: '100%', height: 400 }}>
             {revenueData.length > 0 && isChartReady ? (
                <ResponsiveContainer width="100%" height="100%" debounce={50} minWidth={0} minHeight={0}>
                  <BarChart data={revenueData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 12}} 
                        dy={10} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 12}} 
                        tickFormatter={(value) => `${(value/1000000).toFixed(1)}M`} 
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="roomFee" name="Tiền phòng" stackId="a" fill="#6366F1" radius={[0, 0, 4, 4]} barSize={20} />
                    <Bar dataKey="electricity" name="Điện" stackId="a" fill="#F59E0B" barSize={20} />
                    <Bar dataKey="water" name="Nước" stackId="a" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                   {revenueData.length === 0 ? (
                      <>
                        <TrendingUp size={40} className="mb-4 opacity-20"/>
                        <p>Chưa có dữ liệu hiển thị</p>
                      </>
                   ) : (
                      /* Skeleton Loader */
                      <div className="w-full h-full flex items-end justify-center gap-2 p-10 animate-pulse opacity-30">
                          <div className="w-8 h-1/3 bg-gray-300 dark:bg-gray-600 rounded-t-md"></div>
                          <div className="w-8 h-2/3 bg-gray-300 dark:bg-gray-600 rounded-t-md"></div>
                          <div className="w-8 h-1/2 bg-gray-300 dark:bg-gray-600 rounded-t-md"></div>
                          <div className="w-8 h-3/4 bg-gray-300 dark:bg-gray-600 rounded-t-md"></div>
                      </div>
                   )}
                </div>
             )}
           </div>
        </div>

        {/* RIGHT: SYSTEM HEALTH & ALERTS */}
        <div className="space-y-6">
           
           {/* Occupancy Radial Chart */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-white mb-6 text-lg">Trạng thái phòng</h3>
              <div className="flex items-center justify-center mb-8">
                 <div className="relative w-56 h-56">
                    {/* Background Circle */}
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                      <path 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        className="text-gray-100 dark:text-gray-700" 
                      />
                      {/* Foreground Circle */}
                      <path 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        fill="none" 
                        stroke="url(#gradient)" 
                        strokeWidth="2.5" 
                        strokeDasharray={`${stats.occupancyRate}, 100`} 
                        strokeLinecap="round" 
                        className="drop-shadow-md"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{stats.occupancyRate}%</span>
                       <span className="text-sm font-medium text-gray-400 uppercase tracking-wide mt-1">Lấp đầy</span>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                       <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Còn trống
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">{stats.availableRooms}</span>
                 </div>
                 <div className="flex flex-col p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1.5">
                       <span className="w-2 h-2 rounded-full bg-purple-500"></span> Đã đầy
                    </span>
                    <span className="font-bold text-gray-900 dark:text-white text-lg">{stats.fullRooms}</span>
                 </div>
              </div>
           </div>

           {/* Alerts & Quick Actions */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="font-bold text-gray-800 dark:text-white mb-4 text-lg">Cần chú ý</h3>
              <div className="space-y-4">
                 {unpaidBillsCount > 0 ? (
                    <div className="group p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start gap-4 transition-all hover:shadow-md cursor-pointer">
                       <div className="p-2.5 bg-white dark:bg-red-900/30 rounded-lg text-red-500 shadow-sm border border-red-50 dark:border-transparent">
                          <DollarSign size={20} />
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <p className="font-bold text-gray-800 dark:text-red-100">Thu tiền phòng</p>
                             <span className="bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200 text-[10px] px-1.5 py-0.5 rounded font-bold">{unpaidBillsCount}</span>
                          </div>
                          <p className="text-xs text-red-600/80 dark:text-red-300/80 mt-1 line-clamp-1">Có {unpaidBillsCount} hóa đơn quá hạn hoặc chưa thanh toán.</p>
                       </div>
                    </div>
                 ) : (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex items-center gap-4">
                        <div className="p-2.5 bg-white dark:bg-emerald-900/30 rounded-lg text-emerald-500 shadow-sm border border-emerald-50 dark:border-transparent">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                           <p className="font-bold text-gray-800 dark:text-emerald-100">Tài chính ổn định</p>
                           <p className="text-xs text-emerald-600/80 dark:text-emerald-300/80 mt-1">Đã thu hết tiền điện nước.</p>
                        </div>
                    </div>
                 )}

                 {maintenanceRooms > 0 && (
                    <div className="group p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-4 transition-all hover:shadow-md cursor-pointer">
                       <div className="p-2.5 bg-white dark:bg-amber-900/30 rounded-lg text-amber-500 shadow-sm border border-amber-50 dark:border-transparent">
                          <Wrench size={20} />
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <p className="font-bold text-gray-800 dark:text-amber-100">Bảo trì phòng</p>
                             <span className="bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-200 text-[10px] px-1.5 py-0.5 rounded font-bold">{maintenanceRooms}</span>
                          </div>
                          <p className="text-xs text-amber-600/80 dark:text-amber-300/80 mt-1 line-clamp-1">Có {maintenanceRooms} phòng đang báo hỏng.</p>
                       </div>
                    </div>
                 )}
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
