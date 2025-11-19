
import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string; // Optional: for icon background
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, colorClass = "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-none border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer group`}
    >
      <div className="flex justify-between items-start z-10 relative">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClass} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`flex items-center font-semibold ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {trendUp ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
            {trend}
          </span>
          <span className="text-gray-400 dark:text-gray-500 ml-2 text-xs">so với tháng trước</span>
        </div>
      )}

      {/* Decorative background blob */}
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/20 dark:to-gray-800 rounded-full opacity-50 z-0 group-hover:scale-150 transition-transform duration-500 ease-out pointer-events-none"></div>
    </div>
  );
};

export default StatCard;
