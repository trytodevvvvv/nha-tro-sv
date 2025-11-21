
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Bed, Users, Zap, Sparkles, TrendingUp, DollarSign, AlertTriangle, Wrench, Calendar } from 'lucide-react';
import { dormService } from '../services/dormService';
import StatCard from './StatCard';
import { generateDashboardReport } from '../services/geminiService';
import { DashboardStats, MonthlyRevenue, Room, Bill } from '../types';

const Dashboard: React.FC = () => {
  // Initialize with potentially cached data if available (Sync feel)
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [revenueData, setRevenueData] = useState<MonthlyRevenue[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
        try {
            // Fetch in parallel
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

  // Loading state only shown if NO data exists. If cached data exists, show it.
  if (loading && !stats) return <div className="p-10 text-center text-gray-500">Đang tải dữ liệu thống kê...</div>;
  if (!stats) return null;

  // Quick Insights Data
  const maintenanceRooms = rooms.filter(r => r.status === 'MAINTENANCE').length;
  const unpaidBillsCount = bills.filter(b => b.status === 'UNPAID').length;
  const totalRevenue = bills.reduce((acc, curr) => acc + (curr.status === 'PAID' ? curr.totalAmount : 0), 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload.reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);
      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl">
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Tháng {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-xs mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}></div>
              <span className="text-gray-500 dark:text-gray-400 w-20">{entry.name}:</span>
              <span className="font-medium text-gray-900 dark:text-white flex-1 text-right">
                {entry.value.toLocaleString()} đ
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">Tổng doanh thu:</span>
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{total.toLocaleString()} đ</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* 1. HERO SECTION */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white shadow-xl p-8 md:p-10">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-100 text-sm font-medium mb-2">
              <Calendar size={16} />
              <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">Tổng quan Hệ thống</h1>
            <p className="text-indigo-100 max-w-xl">
              Chào mừng trở lại. Dưới đây là tình hình hoạt động của khu trọ và các chỉ số tài chính quan trọng trong tháng này.
            </p>
          </div>

          <button 
            onClick={handleGenerateReport}
            disabled={loadingAi}
            className="group flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingAi ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles size={20} className="text-yellow-300 group-hover:scale-110 transition-transform" />
            )}
            <span className="font-semibold">{loadingAi ? 'Đang phân tích...' : 'Phân tích AI'}</span>
          </button>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-2xl"></div>
      </div>

      {/* 2. AI REPORT */}
      {aiReport && (
        <div className="bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-800/50 border border-indigo-100 dark:border-gray-700 p-6 rounded-2xl shadow-sm relative overflow-hidden animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 shrink-0">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 text-lg">Phân tích thông minh từ AI</h3>
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{aiReport}</div>
            </div>
          </div>
        </div>
      )}

      {/* 3. STAT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Tổng doanh thu (Đã thu)" 
          value={`${(totalRevenue / 1000000).toFixed(1)}M`}
          icon={<DollarSign size={24} />}
          colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          trend="12.5%"
          trendUp={true}
        />
        <StatCard 
          title="Tỷ lệ lấp đầy" 
          value={`${stats.occupancyRate}%`}
          icon={<TrendingUp size={24} />}
          colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          trend={stats.occupancyRate > 80 ? "Ổn định" : "Cần cải thiện"}
          trendUp={stats.occupancyRate > 80}
        />
        <StatCard 
          title="Cư dân hiện tại" 
          value={stats.totalStudents + stats.totalGuests} 
          icon={<Users size={24} />}
          colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
          trend={`${stats.totalGuests} Khách`}
          trendUp={true}
        />
        <StatCard 
          title="Phòng trống" 
          value={stats.availableRooms} 
          icon={<Bed size={24} />}
          colorClass="bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
          trend={`${stats.fullRooms} Đã đầy`}
          trendUp={false}
        />
      </div>

      {/* 4. CHARTS & INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">Biểu đồ Doanh thu</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Theo dõi dòng tiền hàng tháng</p>
             </div>
          </div>
          
          <div className="h-[350px] w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:opacity-10" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} tickFormatter={(value) => `${(value/1000000).toFixed(0)}M`} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} />
                  <Bar dataKey="roomFee" name="Tiền phòng" stackId="a" fill="#6366F1" radius={[0, 0, 4, 4]} barSize={32} />
                  <Bar dataKey="electricity" name="Tiền điện" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} barSize={32} />
                  <Bar dataKey="water" name="Tiền nước" stackId="a" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                <TrendingUp size={40} className="mb-2 opacity-50"/>
                <p>Chưa có dữ liệu hóa đơn để hiển thị</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Occupancy & Alerts */}
        <div className="space-y-6">
          {/* Occupancy Donut */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center relative overflow-hidden">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6 w-full text-left">Tình trạng phòng</h3>
             <div className="relative w-52 h-52 mb-6">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F3F4F6" strokeWidth="2.5" className="dark:stroke-gray-700" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeDasharray={`${stats.occupancyRate}, 100`} strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(99,102,241,0.4)]" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                   <span className="text-4xl font-black text-gray-900 dark:text-white">{stats.occupancyRate}%</span>
                   <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">Lấp đầy</span>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-3 w-full">
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl text-left">
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Còn trống</p>
                   <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.availableRooms}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl text-left">
                   <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Đã đầy</p>
                   <p className="text-lg font-bold text-gray-900 dark:text-white">{stats.fullRooms}</p>
                </div>
             </div>
          </div>

          {/* Quick Alerts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Cần chú ý</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-red-900/30 rounded-lg text-red-500">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{unpaidBillsCount} Hóa đơn</p>
                    <p className="text-xs text-red-500">Chưa thanh toán</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-amber-900/30 rounded-lg text-amber-500">
                    <Wrench size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{maintenanceRooms} Phòng</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500">Đang bảo trì</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
