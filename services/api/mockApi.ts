
import { MOCK_ROOMS, MOCK_STUDENTS, MOCK_BUILDINGS, MOCK_ASSETS, MOCK_BILLS, MOCK_USERS } from '../mockData';
import { RoomStatus, Role } from '../../types';

// Export the class so types can be inferred
export class MockApi {
  private rooms = [...MOCK_ROOMS];
  private students = [...MOCK_STUDENTS];
  private buildings = [...MOCK_BUILDINGS];
  private assets = [...MOCK_ASSETS];
  private bills = [...MOCK_BILLS];
  private users = [...MOCK_USERS];

  private updateRoomStatusAuto(room: any) {
    if (room.currentCapacity > 0 && room.status === RoomStatus.MAINTENANCE) {
        room.status = RoomStatus.AVAILABLE;
    }

    if (room.status !== RoomStatus.MAINTENANCE) {
        if (room.currentCapacity >= room.maxCapacity) {
            room.status = RoomStatus.FULL;
        } else {
            room.status = RoomStatus.AVAILABLE;
        }
    }
  }

  // --- GETTERS ---
  async getRooms() { return this.rooms; }
  async getStudents() { return this.students; }
  async getBuildings() { return this.buildings; }
  async getAssets() { return this.assets; }
  async getBills() { return this.bills; }
  async getUsers() { return this.users; }

  // --- STATS ---
  async getDashboardStats() {
      const totalRooms = this.rooms.length;
      const occupiedRooms = this.rooms.filter(r => r.currentCapacity > 0).length;
      const fullRooms = this.rooms.filter(r => r.currentCapacity >= r.maxCapacity).length;
      const availableRooms = totalRooms - fullRooms;
      const totalSlots = this.rooms.reduce((acc, r) => acc + r.maxCapacity, 0);
      const usedSlots = this.rooms.reduce((acc, r) => acc + r.currentCapacity, 0);
      const occupancyRate = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

      return {
        totalRooms, occupiedRooms, fullRooms, availableRooms,
        totalStudents: this.students.length,
        occupancyRate
      };
  }

  async getRevenueData() {
        const revenueMap = new Map();
        this.bills.forEach(bill => {
            if (bill.status === 'PAID') {
                if (!revenueMap.has(bill.month)) {
                    revenueMap.set(bill.month, { month: bill.month, electricity: 0, water: 0, roomFee: 0 });
                }
                const data = revenueMap.get(bill.month);
                data.electricity += (bill.electricIndexNew - bill.electricIndexOld) * 3500;
                data.water += (bill.waterIndexNew - bill.waterIndexOld) * 10000;
                data.roomFee += bill.roomFee;
            }
        });
        return Array.from(revenueMap.values()).sort((a: any, b: any) => a.month.localeCompare(b.month));
  }

  // --- AUTH ---
  async login(u: string, p: string) {
      return this.users.find(user => user.username === u && user.password === p);
  }

  // --- MUTATIONS ---
  async addStudent(data: any) {
      const room = this.rooms.find(r => r.id === data.roomId);
      if (!room) throw new Error("Phòng không tồn tại");
      if (room.status === RoomStatus.MAINTENANCE) throw new Error("Phòng đang bảo trì");
      if (room.currentCapacity >= room.maxCapacity) throw new Error("Phòng đã đầy");
      if (this.students.some(s => s.studentCode === data.studentCode)) throw new Error("Mã SV tồn tại");

      const newStudent = { id: `s${Date.now()}`, ...data };
      this.students.push(newStudent);
      room.currentCapacity++;
      this.updateRoomStatusAuto(room);
      return newStudent;
  }

  async deleteStudent(id: string) {
      const idx = this.students.findIndex(s => s.id === id);
      if (idx > -1) {
          const s = this.students[idx];
          const room = this.rooms.find(r => r.id === s.roomId);
          if (room) {
              room.currentCapacity = Math.max(0, room.currentCapacity - 1);
              this.updateRoomStatusAuto(room);
          }
          this.students.splice(idx, 1);
          return { success: true };
      }
      throw new Error("Student not found");
  }

  async updateStudent(id: string, data: any) {
      const idx = this.students.findIndex(s => s.id === id);
      if (idx > -1) {
          const oldRoomId = this.students[idx].roomId;
          const newRoomId = data.roomId;
          
          if (newRoomId && oldRoomId !== newRoomId) {
             const oldRoom = this.rooms.find(r => r.id === oldRoomId);
             const newRoom = this.rooms.find(r => r.id === newRoomId);
             
             if (!newRoom) throw new Error("Phòng mới không tồn tại");
             if (newRoom.status === RoomStatus.MAINTENANCE) throw new Error("Phòng mới đang bảo trì");
             if (newRoom.currentCapacity >= newRoom.maxCapacity) throw new Error("Phòng mới đầy");
             
             if (oldRoom) { 
                 oldRoom.currentCapacity--; 
                 this.updateRoomStatusAuto(oldRoom);
             }
             if (newRoom) { 
                 newRoom.currentCapacity++; 
                 this.updateRoomStatusAuto(newRoom);
             }
          }
          this.students[idx] = { ...this.students[idx], ...data };
          return { success: true };
      }
      throw new Error("Student not found");
  }

  async addRoom(data: any) { this.rooms.push({ id: `r${Date.now()}`, currentCapacity: 0, ...data }); return { success: true }; }
  
  async updateRoom(id: string, data: any) { 
      const idx = this.rooms.findIndex(r => r.id === id); 
      if(idx > -1) { 
          const room = this.rooms[idx];
          
          if (data.status === RoomStatus.MAINTENANCE && room.currentCapacity > 0) {
              throw new Error("Không thể bảo trì phòng có người");
          }

          this.rooms[idx] = {...room, ...data}; 
          this.updateRoomStatusAuto(this.rooms[idx]);
      } 
      return { success: true }; 
  }

  async deleteRoom(id: string) {
      if(this.students.some(s => s.roomId === id)) throw new Error("Phòng có người");
      this.rooms = this.rooms.filter(r => r.id !== id);
      this.bills = this.bills.filter(b => b.roomId !== id);
      this.assets = this.assets.filter(a => a.roomId !== id);
      return { success: true };
  }

  async addBuilding(data: any) { this.buildings.push({ id: `b${Date.now()}`, ...data }); return { success: true }; }
  async updateBuilding(id: string, data: any) { const idx = this.buildings.findIndex(b => b.id === id); if(idx>-1) this.buildings[idx] = {...this.buildings[idx], ...data}; return { success: true }; }
  async deleteBuilding(id: string) { 
      if(this.rooms.some(r => r.buildingId === id)) throw new Error("Tòa nhà đang có phòng"); 
      this.buildings = this.buildings.filter(b => b.id !== id); 
      return { success: true }; 
  }

  async addAsset(data: any) { this.assets.push({ id: `a${Date.now()}`, ...data }); return { success: true }; }
  async updateAsset(id: string, data: any) { const idx = this.assets.findIndex(a => a.id === id); if(idx>-1) this.assets[idx] = {...this.assets[idx], ...data}; return { success: true }; }
  async deleteAsset(id: string) { this.assets = this.assets.filter(a => a.id !== id); return { success: true }; }
  
  async createBill(data: any) {
      const elec = Math.max(0, (data.electricIndexNew - data.electricIndexOld) * 3500);
      const water = Math.max(0, (data.waterIndexNew - data.waterIndexOld) * 10000);
      const total = elec + water + Number(data.roomFee);
      
      let finalDueDate = data.dueDate;
      if (!finalDueDate) {
          const [y, m] = data.month.split('-');
          finalDueDate = new Date(Number(y), Number(m)-1, 10).toISOString();
      }

      this.bills.push({ id: `bill${Date.now()}`, status: 'UNPAID', totalAmount: total, dueDate: finalDueDate, createdAt: new Date().toISOString(), ...data });
      return { success: true };
  }
  async updateBill(id: string, data: any) { 
       const idx = this.bills.findIndex(b => b.id === id);
       if(idx>-1) {
           const elec = Math.max(0, (data.electricIndexNew - data.electricIndexOld) * 3500);
           const water = Math.max(0, (data.waterIndexNew - data.waterIndexOld) * 10000);
           const totalAmount = elec + water + Number(data.roomFee);
           this.bills[idx] = { ...this.bills[idx], ...data, totalAmount };
       }
       return { success: true };
  }
  async deleteBill(id: string) { this.bills = this.bills.filter(b => b.id !== id); return { success: true }; }
  async payBill(id: string) { const b = this.bills.find(b => b.id === id); if(b) { b.status = 'PAID'; b.paymentDate = new Date().toISOString(); } return { success: true }; }
  async unpayBill(id: string) { const b = this.bills.find(b => b.id === id); if(b) { b.status = 'UNPAID'; b.paymentDate = undefined; } return { success: true }; }

  async addUser(data: any) { this.users.push({ id: `u${Date.now()}`, ...data }); return { success: true }; }
  async updateUser(id: string, data: any) { const idx = this.users.findIndex(u => u.id === id); if(idx>-1) this.users[idx] = {...this.users[idx], ...data}; return { success: true }; }
  async deleteUser(id: string) { this.users = this.users.filter(u => u.id !== id); return { success: true }; }
}

export const mockApi = new MockApi();
