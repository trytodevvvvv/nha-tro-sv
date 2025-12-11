
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 4000;

app.use(cors() as any);
app.use(express.json() as any);

// In-memory Mock Data Storage (Placeholder for Real DB)
let users: any[] = [
  { id: 'u1', username: 'admin', password: '123', fullName: 'Quản Trị Viên', role: 'ADMIN' },
  { id: 'u2', username: 'staff', password: '123', fullName: 'Nhân Viên A', role: 'STAFF' },
];
let rooms: any[] = [];
let students: any[] = [];
let buildings: any[] = [];
let assets: any[] = [];
let bills: any[] = [];

// Helper to generate IDs
const genId = () => Math.random().toString(36).substring(2, 9);

// --- SHARED LOGIC ---

// 1. Calculate Room Status
const updateRoomStatusAuto = (room: any) => {
    // If room is Maintenance but occupied, force revert (Safety rule)
    if (room.currentCapacity > 0 && room.status === 'MAINTENANCE') {
        room.status = 'AVAILABLE';
    }

    // Only update status if NOT maintenance
    if (room.status !== 'MAINTENANCE') {
        if (room.currentCapacity >= room.maxCapacity) {
            room.status = 'FULL';
        } else {
            room.status = 'AVAILABLE';
        }
    }
};

// 2. Calculate Bill Details
const calculateBillDetails = (data: any) => {
    const elec = Math.max(0, (data.electricIndexNew - data.electricIndexOld) * 3500);
    const water = Math.max(0, (data.waterIndexNew - data.waterIndexOld) * 10000);
    const totalAmount = elec + water + Number(data.roomFee);

    // Calculate Due Date if not provided (default 10th of next month relative to billing month)
    let finalDueDate = data.dueDate;
    if (!finalDueDate && data.month) {
        const [year, m] = data.month.split('-');
        // Default to 10th day
        finalDueDate = new Date(Number(year), Number(m) - 1, 10, 23, 59, 59).toISOString();
    }
    
    return { totalAmount, dueDate: finalDueDate };
};


// --- AUTH ---
app.post('/api/login', (req: any, res: any) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    res.json(user);
  } else {
    res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
  }
});

// --- DASHBOARD STATS ---
app.get('/api/stats', (req: any, res: any) => {
    const totalRooms = rooms.length;
    const totalStudents = students.length;
    
    const occupiedRooms = rooms.filter(r => r.currentCapacity > 0).length;
    const fullRooms = rooms.filter(r => r.currentCapacity >= r.maxCapacity).length;
    const availableRooms = totalRooms - fullRooms;

    const totalSlots = rooms.reduce((acc, r) => acc + (r.maxCapacity || 0), 0);
    const usedSlots = rooms.reduce((acc, r) => acc + (r.currentCapacity || 0), 0);
    const occupancyRate = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

    res.json({
      totalRooms,
      occupiedRooms,
      fullRooms,
      availableRooms,
      totalStudents,
      occupancyRate
    });
});

app.get('/api/stats/revenue', (req: any, res: any) => {
    const paidBills = bills.filter(b => b.status === 'PAID').sort((a, b) => a.month.localeCompare(b.month));

    const revenueMap = new Map();
    paidBills.forEach(bill => {
      if (!revenueMap.has(bill.month)) {
        revenueMap.set(bill.month, { month: bill.month, electricity: 0, water: 0, roomFee: 0 });
      }
      const data = revenueMap.get(bill.month);
      data.electricity += (bill.electricIndexNew - bill.electricIndexOld) * 3500;
      data.water += (bill.waterIndexNew - bill.waterIndexOld) * 10000;
      data.roomFee += bill.roomFee;
    });

    res.json(Array.from(revenueMap.values()));
});

// --- ROOMS ---
app.get('/api/rooms', (req: any, res: any) => {
  res.json(rooms.sort((a, b) => a.name.localeCompare(b.name)));
});

app.post('/api/rooms', (req: any, res: any) => {
  const room = { id: genId(), currentCapacity: 0, ...req.body };
  
  // Validation: Initial status Check
  if (room.status === 'MAINTENANCE' && room.currentCapacity > 0) room.status = 'AVAILABLE';
  
  rooms.push(room);
  res.json(room);
});

app.put('/api/rooms/:id', (req: any, res: any) => {
  const idx = rooms.findIndex(r => r.id === req.params.id);
  if (idx > -1) {
      const currentRoom = rooms[idx];
      const updates = req.body;

      // Rule: Cannot set MAINTENANCE if occupied
      if (updates.status === 'MAINTENANCE' && currentRoom.currentCapacity > 0) {
          return res.status(400).json({ message: "Không thể bảo trì phòng đang có người ở." });
      }

      // Rule: Cannot shrink capacity below current residents
      if (updates.maxCapacity !== undefined && updates.maxCapacity < currentRoom.currentCapacity) {
          return res.status(400).json({ message: "Sức chứa mới nhỏ hơn số người hiện tại." });
      }

      rooms[idx] = { ...rooms[idx], ...updates };
      
      // Auto-calc status based on new capacity/status
      updateRoomStatusAuto(rooms[idx]);
      
      res.json(rooms[idx]);
  } else {
      res.status(404).json({message: 'Phòng không tồn tại'});
  }
});

app.delete('/api/rooms/:id', (req: any, res: any) => {
    const hasStudents = students.some(s => s.roomId === req.params.id);
    if (hasStudents) {
         res.status(400).json({ message: "Phòng đang có người, không thể xóa" });
         return;
    }
    
    // Cleanup related data
    assets = assets.filter(a => a.roomId !== req.params.id);
    bills = bills.filter(b => b.roomId !== req.params.id);
    rooms = rooms.filter(r => r.id !== req.params.id);
    
    res.json({ success: true });
});

// --- STUDENTS ---
app.get('/api/students', (req: any, res: any) => {
  res.json(students.sort((a, b) => a.name.localeCompare(b.name)));
});

app.post('/api/students', (req: any, res: any) => {
  const { roomId, studentCode } = req.body;
  const room = rooms.find(r => r.id === roomId);
  
  if (!room) { res.status(404).json({ message: "Phòng không tồn tại" }); return; }
  if (room.status === 'MAINTENANCE') { res.status(400).json({ message: "Phòng đang bảo trì" }); return; }
  if (room.currentCapacity >= room.maxCapacity) { res.status(400).json({ message: "Phòng đã đầy" }); return; }
  if (students.some(s => s.studentCode === studentCode)) { res.status(400).json({ message: "Mã sinh viên đã tồn tại" }); return; }

  const student = { id: genId(), ...req.body };
  students.push(student);
  
  room.currentCapacity += 1;
  updateRoomStatusAuto(room);

  res.json(student);
});

app.put('/api/students/:id', (req: any, res: any) => {
  const { id } = req.params;
  const { roomId: newRoomId } = req.body;
  const sIdx = students.findIndex(s => s.id === id);

  if (sIdx === -1) { res.status(404).json({ message: "SV không tồn tại" }); return; }
  
  const currentStudent = students[sIdx];
  const oldRoomId = currentStudent.roomId;
  
  // Logic: Change Room
  if (newRoomId && newRoomId !== oldRoomId) {
      const oldRoom = rooms.find(r => r.id === oldRoomId);
      const newRoom = rooms.find(r => r.id === newRoomId);
      
      // Validate New Room
      if (!newRoom) { res.status(404).json({ message: "Phòng mới không tồn tại" }); return; }
      if (newRoom.status === 'MAINTENANCE') { res.status(400).json({ message: "Phòng mới đang bảo trì" }); return; }
      if (newRoom.currentCapacity >= newRoom.maxCapacity) { res.status(400).json({ message: "Phòng mới đã đầy" }); return; }

      // Update Counts
      if(oldRoom) {
          oldRoom.currentCapacity = Math.max(0, oldRoom.currentCapacity - 1);
          updateRoomStatusAuto(oldRoom);
      }

      newRoom.currentCapacity += 1;
      updateRoomStatusAuto(newRoom);
  }

  students[sIdx] = { ...students[sIdx], ...req.body };
  res.json({ success: true });
});

app.delete('/api/students/:id', (req: any, res: any) => {
  const s = students.find(s => s.id === req.params.id);
  if (!s) { res.status(404).json({ message: "Không tìm thấy SV" }); return; }
  
  const room = rooms.find(r => r.id === s.roomId);
  if(room) {
      room.currentCapacity = Math.max(0, room.currentCapacity - 1);
      updateRoomStatusAuto(room);
  }
  
  students = students.filter(stu => stu.id !== req.params.id);
  res.json({ success: true });
});

// --- BUILDINGS ---
app.get('/api/buildings', (req: any, res: any) => { res.json(buildings); });
app.post('/api/buildings', (req: any, res: any) => { const b = { id: genId(), ...req.body }; buildings.push(b); res.json(b); });
app.put('/api/buildings/:id', (req: any, res: any) => { 
    const idx = buildings.findIndex(b => b.id === req.params.id);
    if(idx > -1) { buildings[idx] = {...buildings[idx], ...req.body}; res.json(buildings[idx]); }
    else res.status(404).json({ message: "Not found" });
});
app.delete('/api/buildings/:id', (req: any, res: any) => {
    if(rooms.some(r => r.buildingId === req.params.id)) {
        res.status(400).json({ message: "Không thể xóa tòa nhà đang có phòng." });
        return;
    }
    buildings = buildings.filter(b => b.id !== req.params.id);
    res.json({ success: true });
});

// --- ASSETS ---
app.get('/api/assets', (req: any, res: any) => { res.json(assets); });
app.post('/api/assets', (req: any, res: any) => { const a = { id: genId(), ...req.body }; assets.push(a); res.json(a); });
app.put('/api/assets/:id', (req: any, res: any) => {
    const idx = assets.findIndex(a => a.id === req.params.id);
    if(idx > -1) { assets[idx] = {...assets[idx], ...req.body}; res.json(assets[idx]); }
    else res.status(404).json({ message: "Not found" });
});
app.delete('/api/assets/:id', (req: any, res: any) => {
    assets = assets.filter(a => a.id !== req.params.id);
    res.json({ success: true });
});

// --- BILLS ---
app.get('/api/bills', (req: any, res: any) => { res.json(bills); });

app.post('/api/bills', (req: any, res: any) => {
  const { totalAmount, dueDate } = calculateBillDetails(req.body);

  const bill = { 
      id: genId(), 
      ...req.body, 
      totalAmount, 
      dueDate, 
      status: 'UNPAID', 
      createdAt: new Date().toISOString() 
  };
  bills.push(bill);
  res.json(bill);
});

app.put('/api/bills/:id', (req: any, res: any) => {
  const idx = bills.findIndex(b => b.id === req.params.id);
  if(idx === -1) { res.status(404).json({ message: "Not found" }); return; }
  
  // Merge existing data with new data to perform calculation
  const mergedData = { ...bills[idx], ...req.body };
  const { totalAmount, dueDate } = calculateBillDetails(mergedData);
  
  bills[idx] = { ...mergedData, totalAmount, dueDate };
  res.json(bills[idx]);
});

app.post('/api/bills/:id/pay', (req: any, res: any) => {
  const idx = bills.findIndex(b => b.id === req.params.id);
  if(idx > -1) { bills[idx].status = 'PAID'; bills[idx].paymentDate = new Date().toISOString(); }
  res.json({ success: true });
});

app.post('/api/bills/:id/unpay', (req: any, res: any) => {
  const idx = bills.findIndex(b => b.id === req.params.id);
  if(idx > -1) { bills[idx].status = 'UNPAID'; bills[idx].paymentDate = null; }
  res.json({ success: true });
});

app.delete('/api/bills/:id', (req: any, res: any) => {
  bills = bills.filter(b => b.id !== req.params.id);
  res.json({ success: true });
});

// --- USERS ---
app.get('/api/users', (req: any, res: any) => { res.json(users); });
app.post('/api/users', (req: any, res: any) => { 
    if(users.some(u => u.username === req.body.username)) {
        res.status(400).json({ message: "Username exists" });
        return;
    }
    const u = { id: genId(), ...req.body }; 
    users.push(u); 
    res.json(u); 
});
app.put('/api/users/:id', (req: any, res: any) => {
    const idx = users.findIndex(u => u.id === req.params.id);
    if(idx > -1) { users[idx] = {...users[idx], ...req.body}; res.json(users[idx]); }
    else res.status(404).json({ message: "Not found" });
});
app.delete('/api/users/:id', (req: any, res: any) => {
    users = users.filter(u => u.id !== req.params.id);
    res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
