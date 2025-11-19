
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
  currentCapacity: number; // Computed: students + guests
  pricePerMonth: number;
}

export interface Student {
  id: string;
  name: string;
  dob: string;
  gender: 'Male' | 'Female';
  phone: string;
  roomId: string;
  university?: string;
}

export interface Guest {
  id: string;
  name: string;
  cccd: string; // ID Card Number
  relation: string; // Relation to student
  relatedStudentId?: string; // Optional link to a specific student
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
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
  dueDate: string; // New field: Hạn thanh toán
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
  occupiedRooms: number; // Partially or Fully occupied
  fullRooms: number;
  availableRooms: number; // Totally empty
  totalStudents: number;
  totalGuests: number;
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
