import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string; 
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, colorClass = "bg-indigo-50 text-indigo-600", onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Decorative gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="relative z-10 flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wide">{title}</p>
          <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {value}
          </h3>
        </div>
        
        <div className={`p-3.5 rounded-2xl ${colorClass} shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="relative z-10 mt-4 flex items-center">
          <span className={`flex items-center text-sm font-bold ${trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} bg-white dark:bg-gray-700/50 px-2 py-0.5 rounded-md shadow-sm`}>
            {trendUp ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
            {trend}
          </span>
          <span className="text-gray-400 dark:text-gray-500 ml-2 text-xs font-medium">so với tháng trước</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;