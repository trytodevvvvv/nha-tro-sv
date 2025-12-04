
import { Room, Student, DashboardStats, Building, Bill, Asset, User, Notification, MonthlyRevenue, RoomStatus, Role } from '../types';
import { MOCK_ROOMS, MOCK_STUDENTS, MOCK_BUILDINGS, MOCK_ASSETS, MOCK_BILLS, MOCK_USERS } from './mockData';

const API_URL = 'http://localhost:4000/api';

class DormService {
  // --- CIRCUIT BREAKER STATE ---
  private isOfflineMode = false;

  // --- IN-MEMORY CACHE ---
  private cache: {
      rooms?: Room[];
      students?: Student[];
      buildings?: Building[];
      assets?: Asset[];
      bills?: Bill[];
      users?: User[];
      stats?: DashboardStats;
      revenue?: MonthlyRevenue[];
  } = {};

  private invalidateCache(keys: (keyof typeof this.cache)[]) {
      keys.forEach(key => {
          this.cache[key] = undefined;
      });
  }
  
  // --- AUTH ---
  public async login(username: string, password: string): Promise<User | null> {
    if (this.isOfflineMode) {
         return MOCK_USERS.find(u => u.username === username && u.password === password) || null;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
      return data;
    } catch (e) {
      console.warn("Backend unavailable, switching to Offline Mode immediately.");
      this.isOfflineMode = true; 
      return MOCK_USERS.find(u => u.username === username && u.password === password) || null;
    }
  }

  // --- GENERIC API CALL HANDLER ---
  private async apiCall(endpoint: string, method: string, data?: any) {
      // 1. Nếu đã ở chế độ Offline, gọi Fallback ngay
      if (this.isOfflineMode) {
          return this.handleMockFallback(endpoint, method, data);
      }

      try {
        const options: RequestInit = { 
            method, 
            headers: { 'Content-Type': 'application/json' } 
        };
        if (data) options.body = JSON.stringify(data);
        
        const res = await fetch(`${API_URL}${endpoint}`, options);
        
        // 2. Parse JSON response (kể cả khi lỗi 400/500 server vẫn thường trả về json message)
        const result = await res.json().catch(() => ({}));

        // 3. Xử lý lỗi HTTP
        if (!res.ok) {
            // Nếu lỗi 404 Not Found, có thể do chưa code API, thử fallback
            if (res.status === 404) {
                console.warn(`Endpoint ${endpoint} not found on server. Trying fallback.`);
                return this.handleMockFallback(endpoint, method, data);
            }
            
            // Trả về thông báo lỗi CỤ THỂ từ Backend (vd: "Phòng đã đầy")
            return { 
                success: false, 
                message: result.message || result.error || `Lỗi Server (${res.status}): ${res.statusText}` 
            };
        }
        
        // 4. Thành công
        return { success: true, data: result.data || result };

      } catch (e) {
        // 5. Lỗi kết nối (Network Error / Connection Refused) -> Chuyển sang Offline Mode
        console.warn(`Backend connection failed (${method} ${endpoint}). Switching to Offline Mode.`);
        this.isOfflineMode = true; 
        return this.handleMockFallback(endpoint, method, data);
      }
  }

  // --- GETTERS (Optimized with Cache) ---
  
  public async getDashboardStats(): Promise<DashboardStats> {
    if (this.cache.stats) return this.cache.stats; 
    if (this.isOfflineMode) return this.calculateMockStats();

    try {
      const res = await fetch(`${API_URL}/stats`);
      if (!res.ok) throw new Error("Fetch failed");
      const data = await res.json();
      this.cache.stats = data;
      return data;
    } catch (e) {
      this.isOfflineMode = true;
      return this.calculateMockStats();
    }
  }

  private calculateMockStats(): DashboardStats {
      const totalRooms = MOCK_ROOMS.length;
      const occupiedRooms = MOCK_ROOMS.filter(r => r.currentCapacity > 0).length;
      const fullRooms = MOCK_ROOMS.filter(r => r.currentCapacity >= r.maxCapacity).length;
      const availableRooms = totalRooms - fullRooms;
      const totalSlots = MOCK_ROOMS.reduce((acc, r) => acc + r.maxCapacity, 0);
      const usedSlots = MOCK_ROOMS.reduce((acc, r) => acc + r.currentCapacity, 0);
      const occupancyRate = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

      const stats = {
        totalRooms, occupiedRooms, fullRooms, availableRooms,
        totalStudents: MOCK_STUDENTS.length,
        occupancyRate
      };
      this.cache.stats = stats;
      return stats;
  }

  public async getRevenueData(): Promise<MonthlyRevenue[]> {
      if (this.cache.revenue) return this.cache.revenue;
      if (this.isOfflineMode) return this.calculateMockRevenue();

      try {
        const res = await fetch(`${API_URL}/stats/revenue`);
        if (res.ok) {
            const data = await res.json();
            this.cache.revenue = data;
            return data;
        }
        throw new Error("Failed");
      } catch(e) {
        this.isOfflineMode = true;
        return this.calculateMockRevenue();
      }
  }

  private calculateMockRevenue(): MonthlyRevenue[] {
        const bills = MOCK_BILLS;
        const revenueMap = new Map<string, MonthlyRevenue>();

        bills.forEach(bill => {
            if (bill.status === 'PAID') {
                if (!revenueMap.has(bill.month)) {
                    revenueMap.set(bill.month, { month: bill.month, electricity: 0, water: 0, roomFee: 0 });
                }
                const data = revenueMap.get(bill.month)!;
                data.electricity += (bill.electricIndexNew - bill.electricIndexOld) * 3500;
                data.water += (bill.waterIndexNew - bill.waterIndexOld) * 10000;
                data.roomFee += bill.roomFee;
            }
        });
        const result = Array.from(revenueMap.values()).sort((a, b) => a.month.localeCompare(b.month));
        this.cache.revenue = result;
        return result;
  }
  
  // --- GENERIC FETCHERS ---
  
  private async genericGet<T>(key: keyof typeof this.cache, endpoint: string, mockData: T): Promise<T> {
      if (this.cache[key]) return this.cache[key] as T;
      if (this.isOfflineMode) {
          this.cache[key] = mockData as any;
          return mockData;
      }

      try {
          const res = await fetch(`${API_URL}${endpoint}`);
          if (!res.ok) throw new Error("Offline");
          const data = await res.json();
          this.cache[key] = data;
          return data;
      } catch (e) {
          this.isOfflineMode = true;
          this.cache[key] = mockData as any;
          return mockData;
      }
  }

  public async getRooms(): Promise<Room[]> { return this.genericGet('rooms', '/rooms', MOCK_ROOMS); }
  public async getStudents(): Promise<Student[]> { return this.genericGet('students', '/students', MOCK_STUDENTS); }
  public async getBuildings(): Promise<Building[]> { return this.genericGet('buildings', '/buildings', MOCK_BUILDINGS); }
  public async getAssets(): Promise<Asset[]> { return this.genericGet('assets', '/assets', MOCK_ASSETS); }
  public async getBills(): Promise<Bill[]> { return this.genericGet('bills', '/bills', MOCK_BILLS); }
  public async getUsers(): Promise<User[]> { return this.genericGet('users', '/users', MOCK_USERS); }

  // --- MUTATIONS ---
  
  public async addStudent(data: any) { this.invalidateCache(['students', 'rooms', 'stats']); return this.apiCall('/students', 'POST', data); }
  public async deleteStudent(id: string) { this.invalidateCache(['students', 'rooms', 'stats']); return this.apiCall(`/students/${id}`, 'DELETE'); }
  public async updateStudent(id: string, data: any) { this.invalidateCache(['students', 'rooms']); return this.apiCall(`/students/${id}`, 'PUT', data); }

  public async addRoom(data: any) { this.invalidateCache(['rooms', 'stats']); return this.apiCall('/rooms', 'POST', data); }
  public async updateRoom(id: string, data: any) { this.invalidateCache(['rooms', 'stats']); return this.apiCall(`/rooms/${id}`, 'PUT', data); }
  public async deleteRoom(id: string) { this.invalidateCache(['rooms', 'assets', 'bills', 'students', 'stats']); return this.apiCall(`/rooms/${id}`, 'DELETE'); }

  public async addBuilding(data: any) { this.invalidateCache(['buildings']); return this.apiCall('/buildings', 'POST', data); }
  public async updateBuilding(id: string, data: any) { this.invalidateCache(['buildings']); return this.apiCall(`/buildings/${id}`, 'PUT', data); }
  public async deleteBuilding(id: string) { this.invalidateCache(['buildings']); return this.apiCall(`/buildings/${id}`, 'DELETE'); }
  
  public async addAsset(data: any) { this.invalidateCache(['assets']); return this.apiCall('/assets', 'POST', data); }
  public async updateAsset(id: string, data: any) { this.invalidateCache(['assets']); return this.apiCall(`/assets/${id}`, 'PUT', data); }
  public async deleteAsset(id: string) { this.invalidateCache(['assets']); return this.apiCall(`/assets/${id}`, 'DELETE'); }
  public async updateAssetStatus(id: string, status: string) { this.invalidateCache(['assets']); return this.apiCall(`/assets/${id}`, 'PUT', { status }); }

  public async createBill(data: any) { this.invalidateCache(['bills', 'revenue']); return this.apiCall('/bills', 'POST', data); }
  public async updateBill(id: string, data: any) { this.invalidateCache(['bills', 'revenue']); return this.apiCall(`/bills/${id}`, 'PUT', data); }
  public async deleteBill(id: string) { this.invalidateCache(['bills', 'revenue']); return this.apiCall(`/bills/${id}`, 'DELETE'); }
  public async payBill(id: string) { this.invalidateCache(['bills', 'revenue', 'stats']); return this.apiCall(`/bills/${id}/pay`, 'POST'); }
  public async unpayBill(id: string) { this.invalidateCache(['bills', 'revenue', 'stats']); return this.apiCall(`/bills/${id}/unpay`, 'POST'); }

  public async addUser(data: any) { this.invalidateCache(['users']); return this.apiCall('/users', 'POST', data); }
  public async updateUser(id: string, data: any) { this.invalidateCache(['users']); return this.apiCall(`/users/${id}`, 'PUT', data); }
  public async deleteUser(id: string) { this.invalidateCache(['users']); return this.apiCall(`/users/${id}`, 'DELETE'); }

  // --- MOCK FALLBACK IMPLEMENTATION ---
  private handleMockFallback(endpoint: string, method: string, data: any): { success: boolean, message?: string, data?: any } {
      
      const payMatch = endpoint.match(/\/bills\/(.+)\/pay/);
      if (payMatch && method === 'POST') {
          const id = payMatch[1];
          
          const bill = MOCK_BILLS.find(b => b.id === id);
          if (bill) {
              bill.status = 'PAID';
              bill.paymentDate = new Date().toISOString();
          }

          const cachedBill = this.cache.bills?.find(b => b.id === id);
          if (cachedBill) {
              cachedBill.status = 'PAID';
              cachedBill.paymentDate = new Date().toISOString();
          }

          return { success: true };
      }

      const unpayMatch = endpoint.match(/\/bills\/(.+)\/unpay/);
      if (unpayMatch && method === 'POST') {
          const id = unpayMatch[1];
          
          const bill = MOCK_BILLS.find(b => b.id === id);
          if (bill) {
              bill.status = 'UNPAID';
              bill.paymentDate = undefined;
          }

          const cachedBill = this.cache.bills?.find(b => b.id === id);
          if (cachedBill) {
              cachedBill.status = 'UNPAID';
              cachedBill.paymentDate = undefined;
          }
          
          return { success: true };
      }

      if (endpoint.startsWith('/students')) {
          if (method === 'POST') {
              const room = MOCK_ROOMS.find(r => r.id === data.roomId);
              if (!room) return { success: false, message: "Phòng không tồn tại (Mock)" };
              if (room.currentCapacity >= room.maxCapacity) return { success: false, message: "Phòng đã đầy (Mock)" };
              if (MOCK_STUDENTS.some(s => s.studentCode === data.studentCode)) return { success: false, message: "Mã sinh viên đã tồn tại (Mock)" };

              const newStudent = { id: `s${Date.now()}`, ...data };
              MOCK_STUDENTS.push(newStudent);
              room.currentCapacity++;
              if(room.currentCapacity >= room.maxCapacity) room.status = RoomStatus.FULL;
              return { success: true, data: newStudent };
          }
          if (method === 'DELETE') {
              const id = endpoint.split('/').pop();
              const idx = MOCK_STUDENTS.findIndex(s => s.id === id);
              if (idx > -1) {
                  const student = MOCK_STUDENTS[idx];
                  // Cập nhật lại phòng
                  const room = MOCK_ROOMS.find(r => r.id === student.roomId);
                  if (room) {
                      room.currentCapacity = Math.max(0, room.currentCapacity - 1);
                      if (room.currentCapacity < room.maxCapacity && room.status === RoomStatus.FULL) {
                          room.status = RoomStatus.AVAILABLE;
                      }
                  }
                  MOCK_STUDENTS.splice(idx, 1);
                  if (this.cache.students) this.cache.students = this.cache.students.filter(s => s.id !== id);
              }
              return { success: true };
          }
          if (method === 'PUT') {
              const id = endpoint.split('/').pop();
              const idx = MOCK_STUDENTS.findIndex(s => s.id === id);
              if (idx > -1) MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], ...data };
              return { success: true };
          }
      }

      if (endpoint.startsWith('/bills')) {
          if (method === 'POST') {
              const elec = Math.max(0, (data.electricIndexNew - data.electricIndexOld) * 3500);
              const water = Math.max(0, (data.waterIndexNew - data.waterIndexOld) * 10000);
              const total = elec + water + Number(data.roomFee);

              const newBill = { 
                  id: `bill${Date.now()}`, 
                  status: 'UNPAID', 
                  createdAt: new Date().toISOString(), 
                  dueDate: new Date(Date.now() + 5*86400000).toISOString(), 
                  totalAmount: total,
                  ...data 
              };
              MOCK_BILLS.push(newBill);
              if (this.cache.bills) this.cache.bills.push(newBill);
              return { success: true };
          }
          if (method === 'DELETE') {
              const id = endpoint.split('/').pop();
              const idx = MOCK_BILLS.findIndex(b => b.id === id);
              if (idx > -1) {
                  MOCK_BILLS.splice(idx, 1);
                  if (this.cache.bills) this.cache.bills = this.cache.bills.filter(b => b.id !== id);
              }
              return { success: true };
          }
          if (method === 'PUT') {
              const id = endpoint.split('/').pop();
              const idx = MOCK_BILLS.findIndex(b => b.id === id);
              if (idx > -1) {
                  const elec = Math.max(0, (data.electricIndexNew - data.electricIndexOld) * 3500);
                  const water = Math.max(0, (data.waterIndexNew - data.waterIndexOld) * 10000);
                  const total = elec + water + Number(data.roomFee);
                  
                  const updatedBill = { ...MOCK_BILLS[idx], ...data, totalAmount: total };
                  MOCK_BILLS[idx] = updatedBill;
                  
                  if (this.cache.bills) {
                      this.cache.bills = this.cache.bills.map(b => b.id === id ? updatedBill : b);
                  }
              }
              return { success: true };
          }
      }

      if (endpoint.startsWith('/assets')) {
          if (method === 'POST') { MOCK_ASSETS.push({ id: `a${Date.now()}`, ...data }); return { success: true }; }
          if (method === 'DELETE') {
             const id = endpoint.split('/').pop();
             const idx = MOCK_ASSETS.findIndex(a => a.id === id);
             if(idx > -1) MOCK_ASSETS.splice(idx, 1);
             return { success: true };
          }
          if (method === 'PUT') {
             const id = endpoint.split('/').pop();
             const idx = MOCK_ASSETS.findIndex(a => a.id === id);
             if(idx > -1) MOCK_ASSETS[idx] = { ...MOCK_ASSETS[idx], ...data };
             return { success: true };
          }
      }

      if (endpoint.startsWith('/buildings')) {
          if (method === 'POST') { MOCK_BUILDINGS.push({ id: `b${Date.now()}`, ...data }); return { success: true }; }
          if (method === 'DELETE') {
             const id = endpoint.split('/').pop();
             const hasRooms = MOCK_ROOMS.some(r => r.buildingId === id);
             if (hasRooms) return { success: false, message: "Không thể xóa tòa nhà đang có phòng (Mock)" };

             const idx = MOCK_BUILDINGS.findIndex(b => b.id === id);
             if(idx > -1) MOCK_BUILDINGS.splice(idx, 1);
             return { success: true };
          }
          if (method === 'PUT') {
             const id = endpoint.split('/').pop();
             const idx = MOCK_BUILDINGS.findIndex(b => b.id === id);
             if(idx > -1) MOCK_BUILDINGS[idx] = { ...MOCK_BUILDINGS[idx], ...data };
             return { success: true };
          }
      }

      if (endpoint.startsWith('/rooms')) {
          if (method === 'POST') { MOCK_ROOMS.push({ id: `r${Date.now()}`, currentCapacity: 0, ...data }); return { success: true }; }
          if (method === 'DELETE') {
             const id = endpoint.split('/').pop();
             
             // 1. Check if room has students
             const hasStudents = MOCK_STUDENTS.some(s => s.roomId === id);
             if (hasStudents) return { success: false, message: "Phòng đang có sinh viên, không thể xóa (Mock)" };

             // 2. Cascade Delete: Assets
             for (let i = MOCK_ASSETS.length - 1; i >= 0; i--) {
                 if (MOCK_ASSETS[i].roomId === id) MOCK_ASSETS.splice(i, 1);
             }

             // 3. Cascade Delete: Bills
             for (let i = MOCK_BILLS.length - 1; i >= 0; i--) {
                 if (MOCK_BILLS[i].roomId === id) MOCK_BILLS.splice(i, 1);
             }

             // 4. Delete Room
             const idx = MOCK_ROOMS.findIndex(r => r.id === id);
             if(idx > -1) MOCK_ROOMS.splice(idx, 1);
             return { success: true };
          }
          if (method === 'PUT') {
             const id = endpoint.split('/').pop();
             const idx = MOCK_ROOMS.findIndex(r => r.id === id);
             if(idx > -1) MOCK_ROOMS[idx] = { ...MOCK_ROOMS[idx], ...data };
             return { success: true };
          }
      }

      if (endpoint.startsWith('/users')) {
        if (method === 'POST') { 
            const newUser = { id: `u${Date.now()}`, ...data };
            MOCK_USERS.push(newUser); 
            if (this.cache.users) this.cache.users.push(newUser);
            return { success: true, data: newUser }; 
        }
        if (method === 'DELETE') {
            const id = endpoint.split('/').pop();
            const idx = MOCK_USERS.findIndex(u => u.id === id);
            if(idx > -1) {
                MOCK_USERS.splice(idx, 1);
                if (this.cache.users) {
                    this.cache.users = this.cache.users.filter(u => u.id !== id);
                }
            }
            return { success: true };
        }
        if (method === 'PUT') {
            const id = endpoint.split('/').pop();
            const idx = MOCK_USERS.findIndex(u => u.id === id);
            if(idx > -1) {
                MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...data };
                if (this.cache.users) {
                    this.cache.users = this.cache.users.map(u => u.id === id ? MOCK_USERS[idx] : u);
                }
            }
            return { success: true };
        }
      }
      
      return { success: true, message: "Simulated success (Offline)" };
  }

  public getNotifications(): Notification[] {
     const notifications: Notification[] = [];
     const today = new Date();
     // Always rely on cache first to get real-time updates after mutations
     const bills = this.cache.bills || MOCK_BILLS;

     bills.forEach(b => {
        if(b.status === 'UNPAID') {
            const due = new Date(b.dueDate);
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) {
                notifications.push({
                    id: `notif_over_${b.id}`,
                    type: 'danger',
                    message: `Hóa đơn tháng ${b.month} (Phòng ${b.roomId}) quá hạn ${Math.abs(diffDays)} ngày!`,
                    timestamp: 'Quá hạn'
                });
            } else if (diffDays <= 3) {
                notifications.push({
                    id: `notif_due_${b.id}`,
                    type: 'warning',
                    message: `Hóa đơn tháng ${b.month} (Phòng ${b.roomId}) sắp hết hạn (${diffDays} ngày).`,
                    timestamp: 'Sắp đến hạn'
                });
            }
        }
     });
     return notifications;
  }
}

export const dormService = new DormService();
