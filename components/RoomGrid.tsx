import React from 'react';
import { dormService } from '../services/dormService';
import { RoomStatus } from '../types';
import { User, AlertCircle } from 'lucide-react';

const RoomGrid: React.FC = () => {
  const rooms = dormService.getRooms();

  const getStatusColor = (status: RoomStatus) => {
    switch (status) {
      case RoomStatus.AVAILABLE: return 'bg-green-100 text-green-800 border-green-200';
      case RoomStatus.FULL: return 'bg-red-100 text-red-800 border-red-200';
      case RoomStatus.MAINTENANCE: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-white border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Room Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {rooms.map(room => (
            <div key={room.id} className={`p-4 rounded-xl border-2 flex flex-col justify-between h-32 transition-all hover:scale-105 cursor-pointer bg-white ${room.status === RoomStatus.FULL ? 'border-red-100' : 'border-green-100'}`}>
            <div className="flex justify-between items-start">
                <span className="font-bold text-xl text-gray-700">{room.name}</span>
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusColor(room.status)}`}>
                {room.status}
                </span>
            </div>
            
            <div className="space-y-2">
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full ${room.status === RoomStatus.FULL ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{ width: `${(room.currentCapacity / room.maxCapacity) * 100}%` }}
                ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User size={12}/> {room.currentCapacity}/{room.maxCapacity}</span>
                    {room.status === RoomStatus.MAINTENANCE && <AlertCircle size={12} />}
                </div>
            </div>
            </div>
        ))}
        </div>
    </div>
  );
};

export default RoomGrid;
