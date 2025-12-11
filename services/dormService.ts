
import { Room, Student, DashboardStats, Building, Bill, Asset, User, Notification, MonthlyRevenue, AssetStatus, RoomStatus } from '../types';
import { mockApi } from './api/mockApi';
import { realApi, ApiError } from './api/realApi';

export class DormService {
  private isOfflineMode = false;
  
  // Cache to reduce flickering when switching modes
  private cache: any = {};

  public isOffline(): boolean { return this.isOfflineMode; }
  public setOfflineMode(status: boolean) { this.isOfflineMode = status; }

  // --- FACADE PATTERN HELPER ---
  // Smart execution: Only fallback if it's truly a connection/server issue
  private async execute<T>(
      realFn: () => Promise<T>, 
      mockFn: () => Promise<T>, 
      cacheKey?: string
  ): Promise<T> {
      if (this.isOfflineMode) {
          return mockFn();
      }

      try {
          const data = await realFn();
          if (cacheKey) this.cache[cacheKey] = data;
          return data;
      } catch (error: any) {
          // Check if it's a Client Error (4xx). If so, DO NOT switch to offline, just throw.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
              throw error;
          }

          // For Network Errors (fetch failed) or Server Errors (5xx), switch to offline
          console.warn("System Error or Offline, switching to Mock Mode.", error); 
          this.isOfflineMode = true;
          return mockFn();
      }
  }

  // --- WRITES (Generalized Wrappers) ---
  private async mutate(realFn: () => Promise<any>, mockFn: () => Promise<any>) {
      if (this.isOfflineMode) return mockFn();
      try {
          await realFn();
          return { success: true };
      } catch (error: any) {
          // Propagate validation errors (e.g. "Room Full") to UI immediately
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
              return { success: false, message: error.message };
          }
          
          console.warn("Write API Error, switching to Offline Mode.");
          this.isOfflineMode = true;
          return mockFn(); 
      }
  }

  // --- AUTH ---
  public async login(u: string, p: string): Promise<User | null> {
      try {
          const user = await realApi.post('/login', { username: u, password: p });
          this.isOfflineMode = false;
          return user;
      } catch (e) {
          console.warn("Online login failed, trying offline...");
          const mockUser = await mockApi.login(u, p);
          if (mockUser) {
              this.isOfflineMode = true;
              return mockUser;
          }
      }
      return null;
  }

  // --- READS ---
  public async getDashboardStats(): Promise<DashboardStats> {
      return this.execute(() => realApi.get('/stats'), () => mockApi.getDashboardStats());
  }

  public async getRevenueData(): Promise<MonthlyRevenue[]> {
      return this.execute(() => realApi.get('/stats/revenue'), () => mockApi.getRevenueData());
  }

  public async getRooms(): Promise<Room[]> { return this.execute(() => realApi.get('/rooms'), () => mockApi.getRooms()); }
  public async getStudents(): Promise<Student[]> { return this.execute(() => realApi.get('/students'), () => mockApi.getStudents()); }
  public async getBuildings(): Promise<Building[]> { return this.execute(() => realApi.get('/buildings'), () => mockApi.getBuildings()); }
  public async getAssets(): Promise<Asset[]> { return this.execute(() => realApi.get('/assets'), () => mockApi.getAssets()); }
  public async getBills(): Promise<Bill[]> { return this.execute(() => realApi.get('/bills'), () => mockApi.getBills()); }
  public async getUsers(): Promise<User[]> { return this.execute(() => realApi.get('/users'), () => mockApi.getUsers()); }

  // --- MUTATIONS ---
  
  public async addStudent(data: any) { return this.mutate(() => realApi.post('/students', data), () => mockApi.addStudent(data)); }
  public async updateStudent(id: string, data: any) { return this.mutate(() => realApi.put(`/students/${id}`, data), () => mockApi.updateStudent(id, data)); }
  public async deleteStudent(id: string) { return this.mutate(() => realApi.delete(`/students/${id}`), () => mockApi.deleteStudent(id)); }

  public async addRoom(data: any) { return this.mutate(() => realApi.post('/rooms', data), () => mockApi.addRoom(data)); }
  public async updateRoom(id: string, data: any) { return this.mutate(() => realApi.put(`/rooms/${id}`, data), () => mockApi.updateRoom(id, data)); }
  public async deleteRoom(id: string) { return this.mutate(() => realApi.delete(`/rooms/${id}`), () => mockApi.deleteRoom(id)); }

  public async addBuilding(data: any) { return this.mutate(() => realApi.post('/buildings', data), () => mockApi.addBuilding(data)); }
  public async updateBuilding(id: string, data: any) { return this.mutate(() => realApi.put(`/buildings/${id}`, data), () => mockApi.updateBuilding(id, data)); }
  public async deleteBuilding(id: string) { return this.mutate(() => realApi.delete(`/buildings/${id}`), () => mockApi.deleteBuilding(id)); }

  public async addAsset(data: any) { return this.mutate(() => realApi.post('/assets', data), () => mockApi.addAsset(data)); }
  public async updateAsset(id: string, data: any) { return this.mutate(() => realApi.put(`/assets/${id}`, data), () => mockApi.updateAsset(id, data)); }
  public async deleteAsset(id: string) { return this.mutate(() => realApi.delete(`/assets/${id}`), () => mockApi.deleteAsset(id)); }
  public async updateAssetStatus(id: string, status: string) { return this.updateAsset(id, { status }); }

  public async createBill(data: any) { return this.mutate(() => realApi.post('/bills', data), () => mockApi.createBill(data)); }
  public async updateBill(id: string, data: any) { return this.mutate(() => realApi.put(`/bills/${id}`, data), () => mockApi.updateBill(id, data)); }
  public async deleteBill(id: string) { return this.mutate(() => realApi.delete(`/bills/${id}`), () => mockApi.deleteBill(id)); }
  public async payBill(id: string) { return this.mutate(() => realApi.post(`/bills/${id}/pay`, {}), () => mockApi.payBill(id)); }
  public async unpayBill(id: string) { return this.mutate(() => realApi.post(`/bills/${id}/unpay`, {}), () => mockApi.unpayBill(id)); }

  public async addUser(data: any) { return this.mutate(() => realApi.post('/users', data), () => mockApi.addUser(data)); }
  public async updateUser(id: string, data: any) { return this.mutate(() => realApi.put(`/users/${id}`, data), () => mockApi.updateUser(id, data)); }
  public async deleteUser(id: string) { return this.mutate(() => realApi.delete(`/users/${id}`), () => mockApi.deleteUser(id)); }

  // --- NOTIFICATION LOGIC ---
  public async getNotifications(): Promise<Notification[]> {
      const notifications: Notification[] = [];
      
      try {
          const [bills, rooms, assets] = await Promise.all([
              this.getBills(),
              this.getRooms(),
              this.getAssets()
          ]);

          const now = new Date();
          const today = now.getTime();

          // 1. BILL ALERTS
          bills.forEach(bill => {
              if (bill.status === 'UNPAID') {
                  const dueDate = new Date(bill.dueDate).getTime();
                  const roomName = rooms.find(r => r.id === bill.roomId)?.name || 'Unknown';
                  
                  if (today > dueDate) {
                      const diffDays = Math.floor((today - dueDate) / (1000 * 3600 * 24));
                      notifications.push({
                          id: `bill-overdue-${bill.id}`,
                          type: 'danger',
                          message: `Hóa đơn P.${roomName} tháng ${bill.month} quá hạn ${diffDays} ngày!`,
                          timestamp: 'Quá hạn'
                      });
                  } else if ((dueDate - today) < (3 * 24 * 3600 * 1000) && (dueDate - today) > 0) {
                      notifications.push({
                          id: `bill-near-${bill.id}`,
                          type: 'warning',
                          message: `Hóa đơn P.${roomName} sắp đến hạn thanh toán.`,
                          timestamp: 'Sắp tới'
                      });
                  }
              }
          });

          // 2. ROOM MAINTENANCE ALERTS
          rooms.forEach(room => {
              if (room.status === RoomStatus.MAINTENANCE) {
                  notifications.push({
                      id: `room-maint-${room.id}`,
                      type: 'info',
                      message: `Phòng ${room.name} đang trong trạng thái bảo trì.`,
                      timestamp: 'Bảo trì'
                  });
              }
          });

          // 3. ASSET BROKEN ALERTS
          assets.forEach(asset => {
              if (asset.status === AssetStatus.BROKEN) {
                  const roomName = rooms.find(r => r.id === asset.roomId)?.name || 'Kho';
                  notifications.push({
                      id: `asset-broken-${asset.id}`,
                      type: 'warning',
                      message: `Thiết bị "${asset.name}" tại P.${roomName} bị hỏng.`,
                      timestamp: 'Hư hỏng'
                  });
              }
          });

      } catch (error) {
          console.error("Failed to generate notifications", error);
      }

      return notifications;
  }
}

export const dormService = new DormService();
