
import React from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendUp, colorClass = "bg-white" }) => {
  return (
    <div className={`${colorClass} dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md duration-300 group`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</h3>
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-gray-700 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm">
          <span className={`font-bold ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} bg-opacity-10 px-2 py-0.5 rounded-full ${trendUp ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
