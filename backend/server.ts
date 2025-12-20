
import express from 'express';
import cors from 'cors';
// @ts-ignore
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = 4000;
const prisma = new PrismaClient();

app.use(cors() as any);
app.use(express.json() as any);

// --- HELPER: MAP DB (snake_case) -> FRONTEND (camelCase) ---
// Do database bạn dùng snake_case (room_id) nhưng frontend dùng camelCase (roomId)
const mapUser = (u: any) => ({
    id: u.id,
    username: u.username,
    password: u.password,
    fullName: u.full_name,
    role: u.role
});

const mapRoom = (r: any) => ({
    id: r.id,
    name: r.name,
    buildingId: r.building_id,
    status: r.status,
    maxCapacity: r.max_capacity,
    currentCapacity: r.current_capacity,
    pricePerMonth: Number(r.price_per_month),
    createdAt: r.created_at
});

const mapStudent = (s: any) => ({
    id: s.id,
    studentCode: s.student_code,
    name: s.name,
    dob: s.dob ? new Date(s.dob).toISOString().split('T')[0] : null,
    gender: s.gender,
    phone: s.phone,
    roomId: s.room_id,
    university: s.university
});

const mapBill = (b: any) => ({
    id: b.id,
    roomId: b.room_id,
    month: b.month,
    electricIndexOld: b.electric_index_old,
    electricIndexNew: b.electric_index_new,
    waterIndexOld: b.water_index_old,
    waterIndexNew: b.water_index_new,
    roomFee: Number(b.room_fee),
    totalAmount: Number(b.total_amount),
    status: b.status,
    dueDate: b.due_date,
    paymentDate: b.payment_date,
    createdAt: b.created_at
});

const mapAsset = (a: any) => ({
    id: a.id,
    name: a.name,
    roomId: a.room_id,
    status: a.status,
    value: Number(a.value)
});

// Helper to generate IDs (fallback if DB doesn't auto-generate, though we usually let DB handle it or use UUID)
// Since schema uses VARCHAR(50), we generate string IDs.
const genId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// --- AUTH ---
app.post('/api/login', async (req: any, res: any) => {
  const { username, password } = req.body;
  try {
      // FIX: prisma.users instead of prisma.user
      const user = await prisma.users.findUnique({
          where: { username } // Username is unique
      });
      
      if (user && user.password === password) {
        res.json(mapUser(user));
      } else {
        res.status(401).json({ message: 'Tên đăng nhập hoặc mật khẩu không đúng' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Database error' });
  }
});

// --- DASHBOARD STATS ---
app.get('/api/stats', async (req: any, res: any) => {
    try {
        // FIX: prisma.rooms, prisma.students
        const totalRooms = await prisma.rooms.count();
        const totalStudents = await prisma.students.count();
        
        // Manual count or use specific queries
        const rooms = await prisma.rooms.findMany();
        const occupiedRooms = rooms.filter((r: any) => r.current_capacity > 0).length;
        const fullRooms = rooms.filter((r: any) => r.status === 'FULL').length;
        const availableRooms = rooms.filter((r: any) => r.status === 'AVAILABLE').length;

        const totalSlots = rooms.reduce((acc: number, r: any) => acc + (r.max_capacity || 0), 0);
        const usedSlots = rooms.reduce((acc: number, r: any) => acc + (r.current_capacity || 0), 0);
        const occupancyRate = totalSlots > 0 ? Math.round((usedSlots / totalSlots) * 100) : 0;

        res.json({
          totalRooms,
          occupiedRooms,
          fullRooms,
          availableRooms,
          totalStudents,
          occupancyRate
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching stats' });
    }
});

app.get('/api/stats/revenue', async (req: any, res: any) => {
    try {
        // FIX: prisma.bills
        const bills = await prisma.bills.findMany({
            where: { status: 'PAID' },
            orderBy: { month: 'asc' }
        });

        const revenueMap = new Map();
        bills.forEach((bill: any) => {
          if (!revenueMap.has(bill.month)) {
            revenueMap.set(bill.month, { month: bill.month, electricity: 0, water: 0, roomFee: 0 });
          }
          const data = revenueMap.get(bill.month);
          // Handle potential null values from DB
          const eNew = bill.electric_index_new || 0;
          const eOld = bill.electric_index_old || 0;
          const wNew = bill.water_index_new || 0;
          const wOld = bill.water_index_old || 0;

          data.electricity += (eNew - eOld) * 3500;
          data.water += (wNew - wOld) * 10000;
          data.roomFee += Number(bill.room_fee);
        });

        res.json(Array.from(revenueMap.values()));
    } catch (error) {
        res.status(500).json({ message: 'Error fetching revenue' });
    }
});

// --- ROOMS ---
app.get('/api/rooms', async (req: any, res: any) => {
  try {
      // FIX: prisma.rooms
      const rooms = await prisma.rooms.findMany({ orderBy: { name: 'asc' } });
      res.json(rooms.map(mapRoom));
  } catch (error) { res.status(500).send(error); }
});

app.post('/api/rooms', async (req: any, res: any) => {
  try {
      // FIX: prisma.rooms
      const room = await prisma.rooms.create({
          data: {
              id: genId(),
              name: req.body.name,
              building_id: req.body.buildingId,
              status: req.body.status || 'AVAILABLE',
              max_capacity: req.body.maxCapacity,
              price_per_month: req.body.pricePerMonth,
              current_capacity: 0
          }
      });
      res.json(mapRoom(room));
  } catch (error) { res.status(500).send(error); }
});

app.put('/api/rooms/:id', async (req: any, res: any) => {
    try {
        const data: any = {};
        if (req.body.name) data.name = req.body.name;
        if (req.body.status) data.status = req.body.status;
        if (req.body.maxCapacity) data.max_capacity = req.body.maxCapacity;
        if (req.body.pricePerMonth) data.price_per_month = req.body.pricePerMonth;
        if (req.body.buildingId) data.building_id = req.body.buildingId;

        // FIX: prisma.rooms
        const room = await prisma.rooms.update({
            where: { id: req.params.id },
            data
        });
        res.json(mapRoom(room));
    } catch (error) { res.status(500).send(error); }
});

app.delete('/api/rooms/:id', async (req: any, res: any) => {
    try {
        // Logic check: occupants
        // FIX: prisma.students
        const count = await prisma.students.count({ where: { room_id: req.params.id } });
        if (count > 0) return res.status(400).json({ message: "Phòng đang có người, không thể xóa" });

        // FIX: prisma.rooms
        await prisma.rooms.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).send(error); }
});

// --- STUDENTS ---
app.get('/api/students', async (req: any, res: any) => {
    try {
        // FIX: prisma.students
        const students = await prisma.students.findMany({ orderBy: { name: 'asc' } });
        res.json(students.map(mapStudent));
    } catch (error) { res.status(500).send(error); }
});

app.post('/api/students', async (req: any, res: any) => {
    try {
        const { roomId, studentCode } = req.body;
        
        // Logic checks
        // FIX: prisma.rooms
        const room = await prisma.rooms.findUnique({ where: { id: roomId } });
        if (!room) return res.status(404).json({ message: "Phòng không tồn tại" });
        if (room.status === 'MAINTENANCE') return res.status(400).json({ message: "Phòng đang bảo trì" });
        if (room.current_capacity >= room.max_capacity) return res.status(400).json({ message: "Phòng đã đầy" });
        
        // FIX: prisma.students
        const exists = await prisma.students.findUnique({ where: { student_code: studentCode } });
        if (exists) return res.status(400).json({ message: "Mã sinh viên đã tồn tại" });

        const student = await prisma.students.create({
            data: {
                id: genId(),
                student_code: req.body.studentCode,
                name: req.body.name,
                dob: new Date(req.body.dob),
                gender: req.body.gender,
                phone: req.body.phone,
                room_id: req.body.roomId,
                university: req.body.university
            }
        });
        
        // Trigger automatically updates room capacity in DB via SQL Trigger, but we return student here
        res.json(mapStudent(student));
    } catch (error) { 
        console.error(error);
        res.status(500).send({ message: 'Lỗi server' }); 
    }
});

app.put('/api/students/:id', async (req: any, res: any) => {
    try {
        const data: any = {};
        if (req.body.name) data.name = req.body.name;
        if (req.body.phone) data.phone = req.body.phone;
        if (req.body.university) data.university = req.body.university;
        if (req.body.gender) data.gender = req.body.gender;
        if (req.body.dob) data.dob = new Date(req.body.dob);
        if (req.body.roomId) {
            // Check new room validity
            // FIX: prisma.rooms
            const newRoom = await prisma.rooms.findUnique({ where: { id: req.body.roomId } });
            if (!newRoom) return res.status(404).json({ message: "Phòng mới không tồn tại" });
            
            // Check logic only if MOVING to a different room
            // FIX: prisma.students
            const currentStudent = await prisma.students.findUnique({ where: { id: req.params.id }});
            if (currentStudent && currentStudent.room_id !== req.body.roomId) {
                if (newRoom.status === 'MAINTENANCE') return res.status(400).json({ message: "Phòng mới đang bảo trì" });
                if (newRoom.current_capacity >= newRoom.max_capacity) return res.status(400).json({ message: "Phòng mới đã đầy" });
            }
            
            data.room_id = req.body.roomId;
        }

        // FIX: prisma.students
        const student = await prisma.students.update({
            where: { id: req.params.id },
            data
        });
        res.json(mapStudent(student));
    } catch (error) { res.status(500).send(error); }
});

app.delete('/api/students/:id', async (req: any, res: any) => {
    try {
        // FIX: prisma.students
        await prisma.students.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).send(error); }
});

// --- BUILDINGS ---
app.get('/api/buildings', async (req: any, res: any) => {
    try {
        // FIX: prisma.buildings
        const data = await prisma.buildings.findMany();
        res.json(data);
    } catch (error) { res.status(500).send(error); }
});
app.post('/api/buildings', async (req: any, res: any) => {
    try {
        // FIX: prisma.buildings
        const data = await prisma.buildings.create({
            data: { id: genId(), name: req.body.name }
        });
        res.json(data);
    } catch (error) { res.status(500).send(error); }
});
app.put('/api/buildings/:id', async (req: any, res: any) => {
    try {
        // FIX: prisma.buildings
        const data = await prisma.buildings.update({
            where: { id: req.params.id },
            data: { name: req.body.name }
        });
        res.json(data);
    } catch (error) { res.status(500).send(error); }
});
app.delete('/api/buildings/:id', async (req: any, res: any) => {
    try {
        // FIX: prisma.buildings
        await prisma.buildings.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { 
        // Likely foreign key constraint
        res.status(400).json({ message: "Không thể xóa tòa nhà đang có phòng." });
    }
});

// --- ASSETS ---
app.get('/api/assets', async (req: any, res: any) => {
    try {
        // FIX: prisma.assets
        const data = await prisma.assets.findMany();
        res.json(data.map(mapAsset));
    } catch (error) { res.status(500).send(error); }
});
app.post('/api/assets', async (req: any, res: any) => {
    try {
        // FIX: prisma.assets
        const data = await prisma.assets.create({
            data: {
                id: genId(),
                name: req.body.name,
                room_id: req.body.roomId,
                status: req.body.status,
                value: req.body.value
            }
        });
        res.json(mapAsset(data));
    } catch (error) { res.status(500).send(error); }
});
app.put('/api/assets/:id', async (req: any, res: any) => {
    try {
        const updateData: any = {};
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.status) updateData.status = req.body.status;
        if (req.body.roomId) updateData.room_id = req.body.roomId;
        if (req.body.value) updateData.value = req.body.value;

        // FIX: prisma.assets
        const data = await prisma.assets.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(mapAsset(data));
    } catch (error) { res.status(500).send(error); }
});
app.delete('/api/assets/:id', async (req: any, res: any) => {
    try {
        // FIX: prisma.assets
        await prisma.assets.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).send(error); }
});

// --- BILLS ---
app.get('/api/bills', async (req: any, res: any) => {
    try {
        // FIX: prisma.bills
        const data = await prisma.bills.findMany({ orderBy: { created_at: 'desc' } });
        res.json(data.map(mapBill));
    } catch (error) { res.status(500).send(error); }
});

app.post('/api/bills', async (req: any, res: any) => {
    try {
        const elec = Math.max(0, (req.body.electricIndexNew - req.body.electricIndexOld) * 3500);
        const water = Math.max(0, (req.body.waterIndexNew - req.body.waterIndexOld) * 10000);
        const total = elec + water + Number(req.body.roomFee);

        let finalDueDate = req.body.dueDate;
        if (!finalDueDate && req.body.month) {
            const [y, m] = req.body.month.split('-');
            finalDueDate = new Date(Number(y), Number(m)-1, 10).toISOString();
        }

        // FIX: prisma.bills
        const bill = await prisma.bills.create({
            data: {
                id: genId(),
                room_id: req.body.roomId,
                month: req.body.month,
                electric_index_old: req.body.electricIndexOld,
                electric_index_new: req.body.electricIndexNew,
                water_index_old: req.body.waterIndexOld,
                water_index_new: req.body.waterIndexNew,
                room_fee: req.body.roomFee,
                total_amount: total,
                status: 'UNPAID',
                due_date: new Date(finalDueDate),
                created_at: new Date()
            }
        });
        res.json(mapBill(bill));
    } catch (error) { res.status(500).send(error); }
});

app.put('/api/bills/:id', async (req: any, res: any) => {
    try {
        // Re-calculate total
        const elec = Math.max(0, (req.body.electricIndexNew - req.body.electricIndexOld) * 3500);
        const water = Math.max(0, (req.body.waterIndexNew - req.body.waterIndexOld) * 10000);
        const total = elec + water + Number(req.body.roomFee);

        // FIX: prisma.bills
        const bill = await prisma.bills.update({
            where: { id: req.params.id },
            data: {
                electric_index_old: req.body.electricIndexOld,
                electric_index_new: req.body.electricIndexNew,
                water_index_old: req.body.waterIndexOld,
                water_index_new: req.body.waterIndexNew,
                room_fee: req.body.roomFee,
                total_amount: total,
                due_date: new Date(req.body.dueDate)
            }
        });
        res.json(mapBill(bill));
    } catch (error) { res.status(500).send(error); }
});

app.post('/api/bills/:id/pay', async (req: any, res: any) => {
    try {
        // FIX: prisma.bills
        await prisma.bills.update({
            where: { id: req.params.id },
            data: { status: 'PAID', payment_date: new Date() }
        });
        res.json({ success: true });
    } catch (error) { res.status(500).send(error); }
});

app.post('/api/bills/:id/unpay', async (req: any, res: any) => {
    try {
        // FIX: prisma.bills
        await prisma.bills.update({
            where: { id: req.params.id },
            data: { status: 'UNPAID', payment_date: null }
        });
        res.json({ success: true });
    } catch (error) { res.status(500).send(error); }
});

app.delete('/api/bills/:id', async (req: any, res: any) => {
    try {
        // FIX: prisma.bills
        await prisma.bills.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).send(error); }
});

// --- USERS ---
app.get('/api/users', async (req: any, res: any) => {
    try {
        // FIX: prisma.users
        const data = await prisma.users.findMany();
        res.json(data.map(mapUser));
    } catch (error) { res.status(500).send(error); }
});

app.post('/api/users', async (req: any, res: any) => {
    try {
        // FIX: prisma.users
        const user = await prisma.users.create({
            data: {
                id: genId(),
                username: req.body.username,
                password: req.body.password,
                full_name: req.body.fullName,
                role: req.body.role
            }
        });
        res.json(mapUser(user));
    } catch (error) { 
        // Unique constraint on username
        res.status(400).json({ message: "Username exists" });
    }
});

app.put('/api/users/:id', async (req: any, res: any) => {
    try {
        const data: any = {};
        if (req.body.fullName) data.full_name = req.body.fullName;
        if (req.body.password) data.password = req.body.password;
        if (req.body.role) data.role = req.body.role;

        // FIX: prisma.users
        const user = await prisma.users.update({
            where: { id: req.params.id },
            data
        });
        res.json(mapUser(user));
    } catch (error) { res.status(500).send(error); }
});

app.delete('/api/users/:id', async (req: any, res: any) => {
    try {
        // FIX: prisma.users
        await prisma.users.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) { res.status(500).send(error); }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
