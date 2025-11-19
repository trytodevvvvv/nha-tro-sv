
import { Room, Guest, Student, DashboardStats, RoomStatus, MonthlyRevenue, Building, Bill, Asset, AssetStatus, User, Role, Notification } from '../types';
import { MOCK_ROOMS, MOCK_STUDENTS, MOCK_GUESTS, MOCK_BUILDINGS, MOCK_ASSETS, MOCK_BILLS, MOCK_USERS } from './mockData';

class DormService {
  private rooms: Room[] = [];
  private students: Student[] = [];
  private guests: Guest[] = [];
  private buildings: Building[] = [];
  private assets: Asset[] = [];
  private bills: Bill[] = [];
  private users: User[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // --- STORAGE MANAGEMENT ---
  private loadFromStorage() {
    const storedRooms = localStorage.getItem('dorm_rooms');
    const storedStudents = localStorage.getItem('dorm_students');
    const storedGuests = localStorage.getItem('dorm_guests');
    const storedBuildings = localStorage.getItem('dorm_buildings');
    const storedAssets = localStorage.getItem('dorm_assets');
    const storedBills = localStorage.getItem('dorm_bills');
    const storedUsers = localStorage.getItem('dorm_users');

    if (storedRooms) {
        this.rooms = JSON.parse(storedRooms);
        this.students = storedStudents ? JSON.parse(storedStudents) : [];
        this.guests = storedGuests ? JSON.parse(storedGuests) : [];
        this.buildings = storedBuildings ? JSON.parse(storedBuildings) : [];
        this.assets = storedAssets ? JSON.parse(storedAssets) : [];
        this.bills = storedBills ? JSON.parse(storedBills) : [];
        this.users = storedUsers ? JSON.parse(storedUsers) : [];
        
        // Recalculate on load to ensure data consistency
        this.recalculateAllRoomCapacities();
    } else {
        console.log('[SYSTEM] Initializing with Mock Data...');
        this.rooms = [...MOCK_ROOMS];
        this.students = [...MOCK_STUDENTS];
        this.guests = [...MOCK_GUESTS];
        this.buildings = [...MOCK_BUILDINGS];
        this.assets = [...MOCK_ASSETS];
        this.bills = [...MOCK_BILLS];
        this.users = [...MOCK_USERS];
        
        this.recalculateAllRoomCapacities();
        this.saveToStorage();
    }
  }

  private saveToStorage() {
    localStorage.setItem('dorm_rooms', JSON.stringify(this.rooms));
    localStorage.setItem('dorm_students', JSON.stringify(this.students));
    localStorage.setItem('dorm_guests', JSON.stringify(this.guests));
    localStorage.setItem('dorm_buildings', JSON.stringify(this.buildings));
    localStorage.setItem('dorm_assets', JSON.stringify(this.assets));
    localStorage.setItem('dorm_bills', JSON.stringify(this.bills));
    localStorage.setItem('dorm_users', JSON.stringify(this.users));
  }

  // --- CORE LOGIC: CAPACITY & STATUS UPDATE ---
  // This is the single source of truth for room status logic
  private updateRoomCapacity(roomId: string): void {
      const idx = this.rooms.findIndex(r => r.id === roomId);
      if (idx === -1) return;

      // 1. Calculate actual occupants
      const studentCount = this.students.filter(s => s.roomId === roomId).length;
      const guestCount = this.guests.filter(g => g.roomId === roomId).length;
      const newCurrentCapacity = studentCount + guestCount;
      
      // 2. Determine new status
      let newStatus = this.rooms[idx].status;
      
      // Only update status automatically if NOT in maintenance mode
      if (this.rooms[idx].status !== RoomStatus.MAINTENANCE) {
          if (newCurrentCapacity >= this.rooms[idx].maxCapacity) {
              newStatus = RoomStatus.FULL;
          } else {
              newStatus = RoomStatus.AVAILABLE;
          }
      }

      // 3. Update the room object in memory
      this.rooms[idx] = { 
          ...this.rooms[idx], 
          currentCapacity: newCurrentCapacity, 
          status: newStatus 
      };
  }

  private recalculateAllRoomCapacities() {
    this.rooms.forEach(room => {
        this.updateRoomCapacity(room.id);
    });
    this.saveToStorage(); // Save cleaned data
  }

  // --- NOTIFICATIONS ---
  public getNotifications(): Notification[] {
      const notifications: Notification[] = [];
      const today = new Date();
      
      const unpaidBills = this.bills.filter(b => b.status === 'UNPAID');

      unpaidBills.forEach(bill => {
          const dueDate = new Date(bill.dueDate);
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const roomName = this.rooms.find(r => r.id === bill.roomId)?.name || bill.roomId;

          if (diffDays < 0) {
              notifications.push({
                  id: `notif-overdue-${bill.id}`,
                  type: 'danger',
                  message: `Phòng ${roomName} quá hạn thanh toán ${Math.abs(diffDays)} ngày.`,
                  timestamp: 'Vừa xong'
              });
          } else if (diffDays <= 3) {
              notifications.push({
                  id: `notif-warn-${bill.id}`,
                  type: 'warning',
                  message: `Phòng ${roomName} sắp hết hạn thanh toán (còn ${diffDays} ngày).`,
                  timestamp: 'Hôm nay'
              });
          }
      });

      return notifications;
  }

  // --- AUTH & USER MANAGEMENT ---
  public login(username: string, password: string): User | null {
      console.log(`[POST] /api/auth/login`, { username });
      const user = this.users.find(u => u.username === username && u.password === password);
      return user || null;
  }

  public getUsers(): User[] {
      return this.users;
  }

  public addUser(user: Omit<User, 'id'>): { success: boolean, message: string } {
      if (this.users.some(u => u.username === user.username)) {
          return { success: false, message: "Tên đăng nhập đã tồn tại" };
      }
      const newUser = { ...user, id: `u${Date.now()}` };
      this.users.push(newUser);
      this.saveToStorage();
      return { success: true, message: "Thêm tài khoản thành công" };
  }

  public updateUser(id: string, data: Partial<User>) {
      const idx = this.users.findIndex(u => u.id === id);
      if (idx === -1) return { success: false, message: "Người dùng không tồn tại" };
      
      this.users[idx] = { ...this.users[idx], ...data };
      this.saveToStorage();
      return { success: true, message: "Cập nhật thành công" };
  }

  public deleteUser(id: string) {
      if (this.users.length <= 1) return { success: false, message: "Không thể xóa tài khoản cuối cùng." };
      this.users = this.users.filter(u => u.id !== id);
      this.saveToStorage();
      return { success: true, message: "Đã xóa tài khoản" };
  }

  // --- DASHBOARD ---
  public getDashboardStats(): DashboardStats {
    const totalRooms = this.rooms.length;
    let occupiedRooms = 0;
    let fullRooms = 0;
    let availableRooms = 0;

    this.rooms.forEach(room => {
      // Rely on pre-calculated currentCapacity for speed, but could double-check here
      const actualCapacity = room.currentCapacity;

      if (actualCapacity > 0) occupiedRooms++;
      
      if (room.status === RoomStatus.MAINTENANCE) {
          // Maintenance logic
      } else if (actualCapacity >= room.maxCapacity) {
          fullRooms++;
      } else {
          availableRooms++;
      }
    });

    const totalSlots = this.rooms.reduce((acc, r) => acc + r.maxCapacity, 0);
    const usedSlots = this.students.length + this.guests.length;
    const occupancyRate = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

    return {
      totalRooms,
      occupiedRooms,
      fullRooms,
      availableRooms,
      totalStudents: this.students.length,
      totalGuests: this.guests.length,
      occupancyRate
    };
  }

  public getRevenueData(): MonthlyRevenue[] {
    const revenueMap: Record<string, MonthlyRevenue> = {};

    this.bills.forEach(bill => {
        const monthKey = bill.month; 
        if (!revenueMap[monthKey]) {
            revenueMap[monthKey] = {
                month: monthKey,
                electricity: 0,
                water: 0,
                roomFee: 0
            };
        }
        const electricityCost = (bill.electricIndexNew - bill.electricIndexOld) * 3500;
        const waterCost = (bill.waterIndexNew - bill.waterIndexOld) * 10000;

        revenueMap[monthKey].electricity += electricityCost;
        revenueMap[monthKey].water += waterCost;
        revenueMap[monthKey].roomFee += bill.roomFee;
    });

    return Object.values(revenueMap).sort((a, b) => a.month.localeCompare(b.month));
  }

  // --- BUILDINGS ---
  public getBuildings() { return this.buildings; }
  
  public addBuilding(name: string) {
    const newBuilding = { id: `b${Date.now()}`, name };
    this.buildings.push(newBuilding);
    this.saveToStorage();
    return newBuilding;
  }

  public updateBuilding(id: string, name: string) {
    const idx = this.buildings.findIndex(b => b.id === id);
    if (idx > -1) {
        this.buildings[idx].name = name;
        this.saveToStorage();
        return { success: true };
    }
    return { success: false, message: "Không tìm thấy tòa nhà" };
  }

  public deleteBuilding(id: string) {
    const hasRooms = this.rooms.some(r => r.buildingId === id);
    if(hasRooms) return { success: false, message: "Không thể xóa tòa nhà này vì vẫn còn phòng đang hoạt động."};
    
    this.buildings = this.buildings.filter(b => b.id !== id);
    this.saveToStorage();
    return { success: true };
  }

  // --- ROOMS ---
  public getRooms() { return this.rooms; }

  public addRoom(room: Omit<Room, 'id' | 'currentCapacity'>) {
    const newRoom: Room = {
      id: `r${Date.now()}`,
      currentCapacity: 0,
      ...room
    };
    this.rooms.push(newRoom);
    // Initial capacity check not needed as it's 0, but good practice if we allowed prepopulating
    this.saveToStorage();
    return { success: true, room: newRoom };
  }

  public updateRoom(id: string, data: Partial<Room>) {
    const idx = this.rooms.findIndex(r => r.id === id);
    if (idx === -1) return { success: false, message: "Không tìm thấy phòng" };
    
    // Update properties
    this.rooms[idx] = { ...this.rooms[idx], ...data };
    
    // Crucial: Recalculate capacity and status because maxCapacity or status might have changed
    this.updateRoomCapacity(id);

    this.saveToStorage();
    return { success: true };
  }

  public deleteRoom(id: string) {
    const room = this.rooms.find(r => r.id === id);
    if (!room) return { success: false, message: "Phòng không tồn tại" };

    // Strictly check actual occupants
    const studentCount = this.students.filter(s => s.roomId === id).length;
    const guestCount = this.guests.filter(g => g.roomId === id).length;

    if (studentCount > 0 || guestCount > 0) {
        return { success: false, message: `Không thể xóa. Phòng đang có ${studentCount} sinh viên và ${guestCount} khách. Vui lòng xóa người trước.` };
    }
    
    // Cascading Delete
    this.assets = this.assets.filter(a => a.roomId !== id);
    this.bills = this.bills.filter(b => b.roomId !== id); 
    
    this.rooms = this.rooms.filter(r => r.id !== id);
    this.saveToStorage();
    return { success: true, message: "Đã xóa phòng và các dữ liệu liên quan." };
  }

  // --- STUDENTS ---
  public getStudents() { return this.students; }
  
  public getStudentsByRoom(roomId: string) {
    return this.students.filter(s => s.roomId === roomId);
  }

  public addStudent(studentData: Omit<Student, 'id'>): { success: boolean; message: string } {
    const roomIndex = this.rooms.findIndex(r => r.id === studentData.roomId);
    if (roomIndex === -1) return { success: false, message: "Phòng không tồn tại" };
    
    const room = this.rooms[roomIndex];
    if (room.status === RoomStatus.MAINTENANCE) return { success: false, message: "Phòng đang bảo trì." };
    if (room.currentCapacity >= room.maxCapacity) return { success: false, message: "Phòng đã đầy" };

    this.students.push({ id: `s${Date.now()}`, ...studentData });
    
    this.updateRoomCapacity(studentData.roomId);
    this.saveToStorage();
    
    return { success: true, message: "Đã thêm sinh viên" };
  }

  public updateStudent(id: string, data: Partial<Student>) {
      const idx = this.students.findIndex(s => s.id === id);
      if (idx === -1) return { success: false, message: "Không tìm thấy sinh viên" };

      const oldRoomId = this.students[idx].roomId;
      const newRoomId = data.roomId;

      // Handle Room Change Logic
      if (newRoomId && newRoomId !== oldRoomId) {
           const newRoom = this.rooms.find(r => r.id === newRoomId);
           if(!newRoom) return { success: false, message: "Phòng mới không tồn tại" };
           if(newRoom.status === RoomStatus.MAINTENANCE) return { success: false, message: "Phòng mới đang bảo trì" };
           if(newRoom.currentCapacity >= newRoom.maxCapacity) return { success: false, message: "Phòng mới đã đầy" };
      }

      this.students[idx] = { ...this.students[idx], ...data };
      
      if (newRoomId && newRoomId !== oldRoomId) {
          this.updateRoomCapacity(oldRoomId);
          this.updateRoomCapacity(newRoomId);
      }

      this.saveToStorage();
      return { success: true };
  }

  public deleteStudent(id: string) {
    const student = this.students.find(s => s.id === id);
    if (!student) return { success: false, message: "Sinh viên không tồn tại" };

    const roomId = student.roomId;
    
    // Remove student
    this.students = this.students.filter(s => s.id !== id);
    
    // Update capacity of the room they left
    this.updateRoomCapacity(roomId);

    this.saveToStorage();
    return { success: true, message: "Đã xóa sinh viên." };
  }

  // --- GUESTS ---
  public getGuests() { return this.guests; }

  public getGuestsByRoom(roomId: string) {
    return this.guests.filter(g => g.roomId === roomId);
  }

  public checkInGuest(guestData: Omit<Guest, 'id'>): { success: boolean; message: string; guest?: Guest } {
    const roomIndex = this.rooms.findIndex(r => r.id === guestData.roomId);
    if (roomIndex === -1) return { success: false, message: "Phòng không tồn tại." };
    const room = this.rooms[roomIndex];

    if (room.status === RoomStatus.MAINTENANCE) return { success: false, message: `Phòng đang bảo trì.` };
    if (room.currentCapacity >= room.maxCapacity) return { success: false, message: `Phòng đã đầy!` };

    const newGuest: Guest = { id: `g${Date.now()}`, ...guestData };
    this.guests.push(newGuest);

    this.updateRoomCapacity(room.id);
    this.saveToStorage();

    return { success: true, message: "Đã thêm khách.", guest: newGuest };
  }

  public updateGuest(id: string, data: Partial<Guest>) {
      const idx = this.guests.findIndex(g => g.id === id);
      if (idx === -1) return { success: false, message: "Khách không tồn tại" };
      
      const oldRoomId = this.guests[idx].roomId;
      const newRoomId = data.roomId;

      this.guests[idx] = { ...this.guests[idx], ...data };

      if(newRoomId && newRoomId !== oldRoomId) {
          this.updateRoomCapacity(oldRoomId);
          this.updateRoomCapacity(newRoomId);
      }

      this.saveToStorage();
      return { success: true };
  }

  public checkOutGuest(id: string) {
     const guest = this.guests.find(g => g.id === id);
     if (!guest) return { success: false, message: "Khách không tồn tại" };

     const roomId = guest.roomId;
     
     // Remove guest
     this.guests = this.guests.filter(g => g.id !== id);
     
     // Update capacity of the room they left
     this.updateRoomCapacity(roomId);
     
     this.saveToStorage();
     return { success: true, message: "Đã trả phòng cho khách." };
  }

  // --- ASSETS ---
  public getAssets() { return this.assets; }
  
  public getAssetsByRoom(roomId: string) {
      return this.assets.filter(a => a.roomId === roomId);
  }

  public addAsset(asset: Omit<Asset, 'id'>) {
      this.assets.push({ id: `a${Date.now()}`, ...asset });
      this.saveToStorage();
      return { success: true };
  }

  public updateAsset(id: string, data: Partial<Asset>) {
      const idx = this.assets.findIndex(a => a.id === id);
      if (idx === -1) return { success: false, message: "Tài sản không tồn tại" };
      
      this.assets[idx] = { ...this.assets[idx], ...data };
      this.saveToStorage();
      return { success: true };
  }

  public updateAssetStatus(id: string, status: AssetStatus) {
      return this.updateAsset(id, { status });
  }

  public deleteAsset(id: string) {
      this.assets = this.assets.filter(a => a.id !== id);
      this.saveToStorage();
      return { success: true };
  }

  // --- BILLS ---
  public getBills() { return this.bills; }

  public createBill(data: Omit<Bill, 'id' | 'totalAmount' | 'createdAt' | 'status' | 'dueDate'>) {
      const electricityCost = (data.electricIndexNew - data.electricIndexOld) * 3500; 
      const waterCost = (data.waterIndexNew - data.waterIndexOld) * 10000; 
      const total = electricityCost + waterCost + data.roomFee;
      
      const createdAt = new Date();
      const dueDate = new Date(createdAt);
      dueDate.setDate(createdAt.getDate() + 5); 

      const newBill: Bill = {
          id: `bill${Date.now()}`,
          ...data,
          totalAmount: total,
          status: 'UNPAID',
          createdAt: createdAt.toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0]
      };
      this.bills.push(newBill);
      this.saveToStorage();
      return { success: true, bill: newBill };
  }

  public updateBill(id: string, data: Partial<Bill>) {
      const idx = this.bills.findIndex(b => b.id === id);
      if (idx === -1) return { success: false, message: "Hóa đơn không tồn tại" };

      const currentBill = { ...this.bills[idx], ...data };
      
      // Recalculate total
      const electricityCost = (currentBill.electricIndexNew - currentBill.electricIndexOld) * 3500;
      const waterCost = (currentBill.waterIndexNew - currentBill.waterIndexOld) * 10000;
      currentBill.totalAmount = electricityCost + waterCost + currentBill.roomFee;

      this.bills[idx] = currentBill;
      this.saveToStorage();
      return { success: true };
  }

  public deleteBill(id: string) {
      this.bills = this.bills.filter(b => b.id !== id);
      this.saveToStorage();
      return { success: true };
  }

  public payBill(id: string) {
      const idx = this.bills.findIndex(b => b.id === id);
      if(idx > -1) {
          this.bills[idx].status = 'PAID';
          this.saveToStorage();
          return { success: true, message: "Xác nhận thanh toán thành công." };
      }
      return { success: false, message: "Hóa đơn không tìm thấy." };
  }
}

export const dormService = new DormService();
