
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

  // Check status for UI
  public isOffline(): boolean {
      return this.isOfflineMode;
  }

  // Force toggle (for testing or manual override)
  public setOfflineMode(status: boolean) {
      this.isOfflineMode = status;
  }

  private invalidateCache(keys: (keyof typeof this.cache)[]) {
      keys.forEach(key => {
          this.cache[key] = undefined;
      });
  }
  
  // --- HELPER: FETCH WITH TIMEOUT ---
  private async fetchWithTimeout(resource: string, options: RequestInit = {}, timeout = 5000) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
      });
      clearTimeout(id);
      return response;
  }

  // --- AUTH ---
  public async login(username: string, password: string): Promise<User | null> {
    if (this.isOfflineMode) {
         return MOCK_USERS.find(u => u.username === username && u.password === password) || null;
    }

    try {
      const res = await this.fetchWithTimeout(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      }, 3000); // Short timeout for login
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
      return data;
    } catch (e) {
      console.warn("Backend unavailable or login failed, switching to Offline Mode.");
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
        
        const res = await this.fetchWithTimeout(`${API_URL}${endpoint}`, options);
        
        // 2. Parse JSON response
        const result = await res.json().catch(() => ({}));

        // 3. Xử lý lỗi HTTP (400, 401, 403, 500) -> Đây là lỗi LOGIC từ server, KHÔNG chuyển sang offline
        if (!res.ok) {
            // Trường hợp đặc biệt: 404 có thể do chưa implement API -> fallback
            if (res.status === 404) {
                console.warn(`Endpoint ${endpoint} not found (404). Trying fallback logic.`);
                return this.handleMockFallback(endpoint, method, data);
            }
            
            return { 
                success: false, 
                message: result.message || result.error || `Lỗi Server (${res.status})` 
            };
        }
        
        // 4. Thành công
        return { success: true, data: result.data || result };

      } catch (e) {
        // 5. Lỗi kết nối (Network Error, Timeout) -> Chuyển sang Offline Mode
        // Chỉ chuyển sang offline khi không thể kết nối tới server
        console.warn(`Backend connection failed (${method} ${endpoint}). Error: ${e}. Switching to Offline Mode.`);
        this.isOfflineMode = true; 
        return this.handleMockFallback(endpoint, method, data);
      }
  }

  // --- GETTERS (Optimized with Cache) ---
  
  public async getDashboardStats(): Promise<DashboardStats> {
    // Luôn ưu tiên tính toán lại nếu đang ở chế độ offline để phản ánh dữ liệu mới nhất
    if (this.isOfflineMode) return this.calculateMockStats();
    
    if (this.cache.stats) return this.cache.stats; 

    try {
      const res = await this.fetchWithTimeout(`${API_URL}/stats`);
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
      // Tính toán Real-time dựa trên dữ liệu Mock hiện tại
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
      // Không cache cứng stats ở chế độ offline để luôn update UI
      return stats;
  }

  public async getRevenueData(): Promise<MonthlyRevenue[]> {
      if (this.isOfflineMode) return this.calculateMockRevenue();
      if (this.cache.revenue) return this.cache.revenue;

      try {
        const res = await this.fetchWithTimeout(`${API_URL}/stats/revenue`);
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
        return result;
  }
  
  // --- GENERIC FETCHERS ---
  
  private async genericGet<T>(key: keyof typeof this.cache, endpoint: string, mockData: T): Promise<T> {
      // Ở chế độ offline, luôn trả về mockData gốc (vì nó có thể đã bị thay đổi bởi mutation)
      // Thay vì trả về this.cache[key], ta trả về trực tiếp reference tới biến MOCK_* để đảm bảo tính mới nhất
      if (this.isOfflineMode) {
          return mockData as any;
      }

      if (this.cache[key]) return this.cache[key] as T;

      try {
          const res = await this.fetchWithTimeout(`${API_URL}${endpoint}`);
          if (!res.ok) throw new Error("Offline");
          const data = await res.json();
          this.cache[key] = data;
          return data;
      } catch (e) {
          this.isOfflineMode = true;
          return mockData as any;
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

  // --- MOCK FALLBACK IMPLEMENTATION (Offline Logic) ---
  private handleMockFallback(endpoint: string, method: string, data: any): { success: boolean, message?: string, data?: any } {
      
      // Simulate Logic Delay
      // await new Promise(resolve => setTimeout(resolve, 300));

      // 1. BILL PAYMENT LOGIC
      const payMatch = endpoint.match(/\/bills\/(.+)\/pay/);
      if (payMatch && method === 'POST') {
          const id = payMatch[1];
          const bill = MOCK_BILLS.find(b => b.id === id);
          if (bill) {
              bill.status = 'PAID';
              bill.paymentDate = new Date().toISOString();
              return { success: true };
          }
          return { success: false, message: "Hóa đơn không tồn tại" };
      }

      const unpayMatch = endpoint.match(/\/bills\/(.+)\/unpay/);
      if (unpayMatch && method === 'POST') {
          const id = unpayMatch[1];
          const bill = MOCK_BILLS.find(b => b.id === id);
          if (bill) {
              bill.status = 'UNPAID';
              bill.paymentDate = undefined;
              return { success: true };
          }
          return { success: false, message: "Hóa đơn không tồn tại" };
      }

      // 2. STUDENT LOGIC (Auto update room capacity)
      if (endpoint.startsWith('/students')) {
          if (method === 'POST') {
              const room = MOCK_ROOMS.find(r => r.id === data.roomId);
              if (!room) return { success: false, message: "Phòng không tồn tại" };
              if (room.currentCapacity >= room.maxCapacity) return { success: false, message: "Phòng đã đầy, không thể thêm sinh viên." };
              if (MOCK_STUDENTS.some(s => s.studentCode === data.studentCode)) return { success: false, message: "Mã sinh viên đã tồn tại." };

              const newStudent = { id: `s${Date.now()}`, ...data };
              MOCK_STUDENTS.push(newStudent);
              
              // Update Room Logic
              room.currentCapacity++;
              if(room.currentCapacity >= room.maxCapacity) room.status = RoomStatus.FULL;
              
              return { success: true, data: newStudent };
          }
          if (method === 'DELETE') {
              const id = endpoint.split('/').pop();
              const idx = MOCK_STUDENTS.findIndex(s => s.id === id);
              if (idx > -1) {
                  const student = MOCK_STUDENTS[idx];
                  // Update Room Logic
                  const room = MOCK_ROOMS.find(r => r.id === student.roomId);
                  if (room) {
                      room.currentCapacity = Math.max(0, room.currentCapacity - 1);
                      if (room.currentCapacity < room.maxCapacity && room.status === RoomStatus.FULL) {
                          room.status = RoomStatus.AVAILABLE;
                      }
                  }
                  MOCK_STUDENTS.splice(idx, 1);
              }
              return { success: true };
          }
          if (method === 'PUT') {
              const id = endpoint.split('/').pop();
              const idx = MOCK_STUDENTS.findIndex(s => s.id === id);
              if (idx > -1) {
                  const oldRoomId = MOCK_STUDENTS[idx].roomId;
                  const newRoomId = data.roomId;
                  
                  // Handle Room Change logic if needed
                  if (oldRoomId !== newRoomId && newRoomId) {
                      const oldRoom = MOCK_ROOMS.find(r => r.id === oldRoomId);
                      const newRoom = MOCK_ROOMS.find(r => r.id === newRoomId);
                      
                      if (newRoom && newRoom.currentCapacity >= newRoom.maxCapacity) {
                          return { success: false, message: "Phòng mới đã đầy." };
                      }

                      if (oldRoom) {
                          oldRoom.currentCapacity--;
                          if(oldRoom.currentCapacity < oldRoom.maxCapacity) oldRoom.status = RoomStatus.AVAILABLE;
                      }
                      if (newRoom) {
                          newRoom.currentCapacity++;
                          if(newRoom.currentCapacity >= newRoom.maxCapacity) newRoom.status = RoomStatus.FULL;
                      }
                  }

                  MOCK_STUDENTS[idx] = { ...MOCK_STUDENTS[idx], ...data };
              }
              return { success: true };
          }
      }

      // 3. BILLS LOGIC
      if (endpoint.startsWith('/bills')) {
          if (method === 'POST') {
              const elec = Math.max(0, (data.electricIndexNew - data.electricIndexOld) * 3500);
              const water = Math.max(0, (data.waterIndexNew - data.waterIndexOld) * 10000);
              const total = elec + water + Number(data.roomFee);

              const [year, month] = data.month.split('-').map(Number);
              const dueDate = new Date(year, month - 1, 9, 12, 0, 0).toISOString();

              const newBill = { 
                  id: `bill${Date.now()}`, 
                  status: 'UNPAID', 
                  createdAt: new Date().toISOString(), 
                  dueDate: dueDate, 
                  totalAmount: total,
                  ...data 
              };
              MOCK_BILLS.push(newBill);
              return { success: true };
          }
          if (method === 'DELETE') {
              const id = endpoint.split('/').pop();
              const idx = MOCK_BILLS.findIndex(b => b.id === id);
              if (idx > -1) MOCK_BILLS.splice(idx, 1);
              return { success: true };
          }
          if (method === 'PUT') {
              const id = endpoint.split('/').pop();
              const idx = MOCK_BILLS.findIndex(b => b.id === id);
              if (idx > -1) {
                  const elec = Math.max(0, (data.electricIndexNew - data.electricIndexOld) * 3500);
                  const water = Math.max(0, (data.waterIndexNew - data.waterIndexOld) * 10000);
                  const total = elec + water + Number(data.roomFee);
                  
                  let dueDate = MOCK_BILLS[idx].dueDate;
                  if (data.month) {
                      const [year, month] = data.month.split('-').map(Number);
                      dueDate = new Date(year, month - 1, 9, 12, 0, 0).toISOString();
                  }

                  MOCK_BILLS[idx] = { ...MOCK_BILLS[idx], ...data, totalAmount: total, dueDate };
              }
              return { success: true };
          }
      }

      // 4. ASSETS LOGIC
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

      // 5. BUILDINGS LOGIC
      if (endpoint.startsWith('/buildings')) {
          if (method === 'POST') { MOCK_BUILDINGS.push({ id: `b${Date.now()}`, ...data }); return { success: true }; }
          if (method === 'DELETE') {
             const id = endpoint.split('/').pop();
             const hasRooms = MOCK_ROOMS.some(r => r.buildingId === id);
             if (hasRooms) return { success: false, message: "Không thể xóa tòa nhà đang có phòng." };

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

      // 6. ROOMS LOGIC
      if (endpoint.startsWith('/rooms')) {
          if (method === 'POST') { MOCK_ROOMS.push({ id: `r${Date.now()}`, currentCapacity: 0, ...data }); return { success: true }; }
          if (method === 'DELETE') {
             const id = endpoint.split('/').pop();
             const hasStudents = MOCK_STUDENTS.some(s => s.roomId === id);
             if (hasStudents) return { success: false, message: "Phòng đang có sinh viên, không thể xóa." };

             // Cascade Delete
             for (let i = MOCK_ASSETS.length - 1; i >= 0; i--) {
                 if (MOCK_ASSETS[i].roomId === id) MOCK_ASSETS.splice(i, 1);
             }
             for (let i = MOCK_BILLS.length - 1; i >= 0; i--) {
                 if (MOCK_BILLS[i].roomId === id) MOCK_BILLS.splice(i, 1);
             }

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

      // 7. USERS LOGIC
      if (endpoint.startsWith('/users')) {
        if (method === 'POST') { 
            const newUser = { id: `u${Date.now()}`, ...data };
            MOCK_USERS.push(newUser); 
            return { success: true, data: newUser }; 
        }
        if (method === 'DELETE') {
            const id = endpoint.split('/').pop();
            const idx = MOCK_USERS.findIndex(u => u.id === id);
            if(idx > -1) MOCK_USERS.splice(idx, 1);
            return { success: true };
        }
        if (method === 'PUT') {
            const id = endpoint.split('/').pop();
            const idx = MOCK_USERS.findIndex(u => u.id === id);
            if(idx > -1) MOCK_USERS[idx] = { ...MOCK_USERS[idx], ...data };
            return { success: true };
        }
      }
      
      return { success: true, message: "Action simulated in Offline Mode" };
  }

  public getNotifications(): Notification[] {
     const notifications: Notification[] = [];
     const today = new Date();
     
     // Luôn dùng dữ liệu thực tế (dù là mock hay cache)
     const bills = this.isOfflineMode ? MOCK_BILLS : (this.cache.bills || []);
     const rooms = this.isOfflineMode ? MOCK_ROOMS : (this.cache.rooms || []);

     bills.forEach(b => {
        if(b.status === 'UNPAID') {
            const due = new Date(b.dueDate);
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            const roomName = rooms.find(r => r.id === b.roomId)?.name || b.roomId;
            
            if (diffDays < 0) {
                notifications.push({
                    id: `notif_over_${b.id}`,
                    type: 'danger',
                    message: `Hóa đơn tháng ${b.month} (Phòng ${roomName}) quá hạn ${Math.abs(diffDays)} ngày!`,
                    timestamp: 'Quá hạn'
                });
            } else if (diffDays <= 3) {
                notifications.push({
                    id: `notif_due_${b.id}`,
                    type: 'warning',
                    message: `Hóa đơn tháng ${b.month} (Phòng ${roomName}) sắp hết hạn (${diffDays} ngày).`,
                    timestamp: 'Sắp đến hạn'
                });
            }
        }
     });
     return notifications;
  }
}

export const dormService = new DormService();
