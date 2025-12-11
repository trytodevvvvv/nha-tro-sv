
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Bed, Users, Sparkles, TrendingUp, DollarSign, AlertTriangle, Wrench, Calendar, PieChart, CheckCircle2, Sun, Moon, CloudSun, Activity, ChevronRight } from 'lucide-react';
import { dormService } from '../services/dormService';
import StatCard from './StatCard';
import { generateDashboardReport } from '../services/geminiService';
import { DashboardStats, MonthlyRevenue, Room, Bill } from '../types';

// Optimized Skeleton Component - Removed excessive nesting and pulsing
const DashboardSkeleton = () => (
  <div className="space-y-8 animate-pulse max-w-[1600px] mx-auto pb-10 px-2 md:px-0">
    <div className="flex flex-col md:flex-row justify-between items-end gap-4">
      <div className="space-y-3 w-full md:w-auto">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
        <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
      </div>
      <div className="h-12 w-40 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-36 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 h-[480px] bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700"></div>
      <div className="flex flex-col gap-6">
         <div className="h-72 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700"></div>
         <div className="flex-1 bg-white/50 dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 min-h-[200px]"></div>
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartFilter, setChartFilter] = useState<'6M' | 'Y' | 'ALL'>('6M');
  const [isChartReady, setIsChartReady] = useState(false);

  // Greeting Logic
  const hour = new Date().getHours();
  let greeting = 'Xin chào';
  let GreetingIcon = Sun;
  if (hour < 12) { greeting = 'Chào buổi sáng'; GreetingIcon = CloudSun; }
  else if (hour < 18) { greeting = 'Chào buổi chiều'; GreetingIcon = Sun; }
  else { greeting = 'Chào buổi tối'; GreetingIcon = Moon; }

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
        try {
            // Reduced artificial delay for snappier feel
            await new Promise(r => setTimeout(r, 200)); 
            
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
                setTimeout(() => { if (mounted) setIsChartReady(true); }, 50);
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

  const getFilteredRevenue = () => {
      if (chartFilter === 'ALL') return revenueData;
      const now = new Date();
      const currentYear = now.getFullYear();
      if (chartFilter === 'Y') return revenueData.filter(d => d.month.startsWith(String(currentYear)));
      if (chartFilter === '6M') {
          const cutoffDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
          const cutoffStr = cutoffDate.toISOString().slice(0, 7);
          return revenueData.filter(d => d.month >= cutoffStr);
      }
      return revenueData;
  };

  const filteredRevenueData = getFilteredRevenue();

  if (loading || !stats) return <DashboardSkeleton />;

  const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const unpaidBillsCount = bills.filter(b => b.status === 'UNPAID').length;
  const totalRevenue = bills.reduce((acc, curr) => acc + (curr.status === 'PAID' ? curr.totalAmount : 0), 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white/95 dark:bg-gray-800/95 p-3 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg text-sm z-50 backdrop-blur-sm min-w-[180px]">
          <p className="font-bold text-gray-700 dark:text-gray-200 mb-2 border-b border-gray-100 dark:border-gray-700 pb-2">
            Tháng {label}
          </p>
          <div className="space-y-1.5">
            {payload.map((entry: any, index: number) => (
                <div key={index} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                        <span className="text-gray-500 dark:text-gray-400 font-medium text-[10px] uppercase tracking-wide">{entry.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white font-mono text-xs">
                        {(entry.value).toLocaleString()} đ
                    </span>
                </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-600 flex justify-between font-bold text-xs">
              <span className="text-gray-600 dark:text-gray-300">Tổng thu</span>
              <span className="text-indigo-600 dark:text-indigo-400">{total.toLocaleString()} đ</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-[1600px] mx-auto">
      
      {/* 1. WELCOME HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 px-1">
        <div>
           <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold mb-1">
              <GreetingIcon size={20} className="animate-pulse" />
              <span className="uppercase tracking-wider text-xs font-extrabold">{greeting}</span>
           </div>
           <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Tổng quan Hệ thống
           </h1>
           <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 font-medium text-sm">
              <Calendar size={16} className="text-gray-400 dark:text-gray-500"/>
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
        </div>
        
        <div>
             <button 
                onClick={handleGenerateReport}
                disabled={loadingAi}
                className="group relative overflow-hidden flex items-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-2xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                {loadingAi ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin relative z-10"/>
                ) : (
                  <Sparkles size={18} className="text-yellow-400 dark:text-yellow-600 group-hover:rotate-12 transition-transform relative z-10"/>
                )}
                <span className="relative z-10 text-sm">{loadingAi ? 'Đang phân tích...' : 'Báo cáo AI Gemini'}</span>
             </button>
        </div>
      </div>

      {/* 2. STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard 
          title="Doanh thu" 
          value={`${(totalRevenue / 1000000).toFixed(1)}M`}
          icon={<DollarSign size={24} />}
          colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"
          trend="Tháng này"
          trendUp={true}
        />
        <StatCard 
          title="Sinh viên" 
          value={stats.totalStudents} 
          icon={<Users size={24} />}
          colorClass="bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
          trend="Hoạt động"
          trendUp={true}
        />
        <StatCard 
          title="Phòng trống" 
          value={stats.availableRooms} 
          icon={<Bed size={24} />}
          colorClass="bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400"
          trend={`${stats.fullRooms} đầy`}
          trendUp={false}
        />
        <StatCard 
          title="Lấp đầy" 
          value={`${stats.occupancyRate}%`}
          icon={<PieChart size={24} />}
          colorClass="bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400"
          trend="Hiệu suất"
          trendUp={stats.occupancyRate > 80}
        />
      </div>

      {/* 3. AI INSIGHTS */}
      {aiReport && (
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 relative overflow-hidden shadow-xl animate-fade-in text-white">
           {/* Simple static background shapes for better performance */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"></div>
           
           <div className="relative z-10 flex flex-col md:flex-row gap-6">
              <div className="hidden md:flex flex-col items-center justify-center p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 min-w-[80px]">
                <Sparkles className="text-yellow-300 drop-shadow-sm" size={24} />
                <span className="text-[10px] font-bold mt-1 opacity-80 uppercase tracking-widest">AI</span>
              </div>
              <div className="flex-1 space-y-3">
                 <h3 className="text-lg font-bold text-white flex items-center gap-3">
                    Đề xuất từ AI
                 </h3>
                 <div className="text-indigo-50 text-sm whitespace-pre-line leading-relaxed font-medium opacity-95 bg-black/10 p-4 rounded-xl border border-white/5">
                    {aiReport}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* 4. MAIN ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT: REVENUE CHART */}
        <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[520px]">
           <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-lg">
                    <Activity size={20} className="text-indigo-600 dark:text-indigo-400" />
                    Biểu đồ Doanh thu
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">Theo dõi thu nhập từ tiền phòng và dịch vụ</p>
              </div>
              <div className="flex bg-gray-50 dark:bg-gray-700/50 p-1 rounded-xl border border-gray-100 dark:border-gray-600">
                 {['6M', 'Y', 'ALL'].map((f) => (
                     <button 
                        key={f}
                        onClick={() => setChartFilter(f as any)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${chartFilter === f ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'}`}
                     >
                        {f === '6M' ? '6 Tháng' : f === 'Y' ? 'Năm nay' : 'Tất cả'}
                     </button>
                 ))}
              </div>
           </div>
           
           <div className="flex-1 w-full min-h-0">
             {filteredRevenueData.length > 0 && isChartReady ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredRevenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }} barGap={6}>
                    <defs>
                        <linearGradient id="colorRoom" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0.9}/>
                        </linearGradient>
                        <linearGradient id="colorElec" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.9}/>
                        </linearGradient>
                         <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.9}/>
                            <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.9}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" className="dark:stroke-gray-700 dark:opacity-40" />
                    <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 600}} 
                        dy={10} 
                    />
                    <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 500}} 
                        tickFormatter={(value) => `${(value/1000000).toFixed(0)}`} 
                        dx={-5}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99, 102, 241, 0.04)', radius: 6}} />
                    <Legend 
                        iconType="circle" 
                        iconSize={6}
                        wrapperStyle={{ paddingTop: '15px', fontSize: '11px', fontWeight: 600, color: '#6B7280' }} 
                    />
                    <Bar dataKey="roomFee" name="Tiền phòng" stackId="a" fill="url(#colorRoom)" radius={[0, 0, 4, 4]} barSize={24} />
                    <Bar dataKey="electricity" name="Điện" stackId="a" fill="url(#colorElec)" barSize={24} />
                    <Bar dataKey="water" name="Nước" stackId="a" fill="url(#colorWater)" radius={[4, 4, 0, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 opacity-60">
                    <TrendingUp size={48} className="mb-4 opacity-20"/>
                    <p className="font-medium text-sm">Chưa có dữ liệu hiển thị</p>
                </div>
             )}
           </div>
        </div>

        {/* RIGHT: SYSTEM HEALTH & ALERTS */}
        <div className="space-y-6 flex flex-col h-full">
           
           {/* Occupancy Radial Chart */}
           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden flex-shrink-0">
              <h3 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-2">
                  <PieChart size={20} className="text-purple-500" />
                  Trạng thái phòng
              </h3>
              
              <div className="flex items-center justify-between gap-6">
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
                      <path 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="3" 
                        className="text-gray-100 dark:text-gray-700" 
                        strokeLinecap="round"
                      />
                      <path 
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                        fill="none" 
                        stroke="url(#gradient)" 
                        strokeWidth="3" 
                        strokeDasharray={`${stats.occupancyRate}, 100`} 
                        strokeLinecap="round" 
                        className="transition-all duration-1000 ease-out"
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                       <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stats.occupancyRate}%</span>
                       <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Lấp đầy</span>
                    </div>
                </div>

                <div className="flex-1 space-y-3">
                     <div className="group">
                         <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                Còn trống
                             </div>
                             <span className="font-bold text-gray-900 dark:text-white text-sm">{stats.availableRooms}</span>
                         </div>
                         <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(stats.availableRooms/stats.totalRooms)*100}%` }}></div>
                         </div>
                     </div>

                     <div className="group">
                         <div className="flex items-center justify-between mb-1">
                             <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Đã đầy
                             </div>
                             <span className="font-bold text-gray-900 dark:text-white text-sm">{stats.fullRooms}</span>
                         </div>
                         <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(stats.fullRooms/stats.totalRooms)*100}%` }}></div>
                         </div>
                     </div>
                </div>
              </div>
           </div>

           {/* Alerts & Quick Actions */}
           <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                    <div className="relative">
                        <AlertTriangle className="text-amber-500" size={20} />
                        {(unpaidBillsCount > 0 || maintenanceRooms > 0) && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>}
                    </div>
                    Danh sách chờ
                </h3>
              </div>
              
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-600">
                 {unpaidBillsCount > 0 ? (
                    <div className="group p-4 bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 rounded-2xl flex items-center gap-3 transition-all hover:bg-red-50/50 dark:hover:bg-red-900/10 cursor-pointer">
                       <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500 shrink-0">
                          <DollarSign size={20} strokeWidth={2.5} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                             <p className="font-bold text-gray-900 dark:text-red-100 text-sm truncate">Thu tiền phòng</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-bold text-red-600 dark:text-red-400">{unpaidBillsCount}</span> hóa đơn chưa thanh toán
                          </p>
                       </div>
                       <ChevronRight size={18} className="text-gray-300 group-hover:text-red-500 transition-colors" />
                    </div>
                 ) : (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl flex items-center gap-3">
                        <div className="p-3 bg-white dark:bg-emerald-900/30 rounded-xl text-emerald-500 shadow-sm border border-emerald-50 dark:border-transparent">
                            <CheckCircle2 size={20} />
                        </div>
                        <div>
                           <p className="font-bold text-gray-900 dark:text-emerald-100 text-sm">Tài chính ổn định</p>
                           <p className="text-xs text-emerald-600/80 dark:text-emerald-300/80 mt-0.5">Đã thu hết tiền điện nước.</p>
                        </div>
                    </div>
                 )}

                 {maintenanceRooms > 0 ? (
                    <div className="group p-4 bg-white dark:bg-gray-800 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex items-center gap-3 transition-all hover:bg-amber-50/50 dark:hover:bg-amber-900/10 cursor-pointer">
                       <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-500 shrink-0">
                          <Wrench size={20} strokeWidth={2.5} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                             <p className="font-bold text-gray-900 dark:text-amber-100 text-sm truncate">Bảo trì phòng</p>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-bold text-amber-600 dark:text-amber-400">{maintenanceRooms}</span> phòng đang báo hỏng
                          </p>
                       </div>
                       <ChevronRight size={18} className="text-gray-300 group-hover:text-amber-500 transition-colors" />
                    </div>
                 ) : (
                     <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-2xl flex items-center gap-3 opacity-75">
                         <div className="p-3 bg-white dark:bg-gray-700 rounded-xl text-gray-400">
                             <CheckCircle2 size={20} />
                         </div>
                         <div>
                            <p className="font-bold text-gray-700 dark:text-gray-300 text-sm">Cơ sở vật chất tốt</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Không có phòng cần bảo trì.</p>
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
