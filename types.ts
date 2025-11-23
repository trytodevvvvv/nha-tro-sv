

export enum RoomStatus {
  AVAILABLE = 'AVAILABLE',
  FULL = 'FULL',
  MAINTENANCE = 'MAINTENANCE'
}

export enum Role {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export enum AssetStatus {
  GOOD = 'GOOD',
  BROKEN = 'BROKEN',
  REPAIRING = 'REPAIRING'
}

export interface User {
  id: string;
  username: string;
  password?: string; // Optional for display, required for logic
  fullName: string;
  role: Role;
}

export interface Building {
  id: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  buildingId: string;
  status: RoomStatus;
  maxCapacity: number;
  currentCapacity: number; // Computed: students
  pricePerMonth: number;
}

export interface Student {
  id: string;
  studentCode: string; // Mã sinh viên (MSV)
  name: string;
  dob: string;
  gender: 'Male' | 'Female';
  phone: string;
  roomId: string;
  university?: string;
}

export interface Bill {
  id: string;
  roomId: string;
  month: string; // Format YYYY-MM
  electricIndexOld: number;
  electricIndexNew: number;
  waterIndexOld: number;
  waterIndexNew: number;
  roomFee: number;
  totalAmount: number;
  status: 'PAID' | 'UNPAID';
  createdAt: string;
  dueDate: string; // Hạn thanh toán
  paymentDate?: string; // Ngày thực tế thanh toán
}

export interface Asset {
  id: string;
  name: string;
  roomId: string;
  status: AssetStatus;
  value: number;
}

export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  fullRooms: number;
  availableRooms: number;
  totalStudents: number;
  occupancyRate: number;
}

export interface MonthlyRevenue {
  month: string;
  electricity: number;
  water: number;
  roomFee: number;
}

export interface Notification {
  id: string;
  type: 'warning' | 'danger' | 'info';
  message: string;
  timestamp: string;
}

export interface Guest {
  id: string;
  name: string;
  cccd: string;
  relation: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
}