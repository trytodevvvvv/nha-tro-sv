
import { Room, RoomStatus, Student, Building, Bill, Asset, AssetStatus, User, Role, Guest } from '../types';

export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'admin', password: '123', fullName: 'Quản Trị Viên', role: Role.ADMIN },
  { id: 'u2', username: 'staff', password: '123', fullName: 'Nhân Viên A', role: Role.STAFF },
];

export const MOCK_BUILDINGS: Building[] = [
  { id: 'b1', name: 'Tòa nhà A' },
  { id: 'b2', name: 'Tòa nhà B' },
  { id: 'b3', name: 'Tòa nhà C' },
];

export const MOCK_ROOMS: Room[] = [
  { id: 'r1', name: '101', buildingId: 'b1', status: RoomStatus.FULL, maxCapacity: 4, currentCapacity: 4, pricePerMonth: 2000000 },
  { id: 'r2', name: '102', buildingId: 'b1', status: RoomStatus.AVAILABLE, maxCapacity: 4, currentCapacity: 2, pricePerMonth: 2000000 },
  { id: 'r3', name: '103', buildingId: 'b1', status: RoomStatus.AVAILABLE, maxCapacity: 4, currentCapacity: 0, pricePerMonth: 2000000 },
  { id: 'r4', name: '201', buildingId: 'b2', status: RoomStatus.AVAILABLE, maxCapacity: 6, currentCapacity: 3, pricePerMonth: 1800000 },
  { id: 'r5', name: '202', buildingId: 'b2', status: RoomStatus.MAINTENANCE, maxCapacity: 6, currentCapacity: 0, pricePerMonth: 1800000 },
];

export const MOCK_STUDENTS: Student[] = [
  { id: 's1', studentCode: 'SV001', name: 'Nguyễn Văn A', dob: '2003-01-01', gender: 'Male', phone: '0901234567', roomId: 'r1', university: 'Đại học CNTT' },
  { id: 's2', studentCode: 'SV002', name: 'Trần Văn B', dob: '2003-02-01', gender: 'Male', phone: '0901234568', roomId: 'r1', university: 'Đại học Luật' },
  { id: 's3', studentCode: 'SV003', name: 'Lê Văn C', dob: '2003-03-01', gender: 'Male', phone: '0901234569', roomId: 'r1', university: 'Đại học CNTT' },
  { id: 's4', studentCode: 'SV004', name: 'Phạm Văn D', dob: '2003-04-01', gender: 'Male', phone: '0901234560', roomId: 'r1', university: 'Đại học Kinh tế' },
  { id: 's5', studentCode: 'SV005', name: 'Hoàng Thị E', dob: '2003-05-01', gender: 'Female', phone: '0901234561', roomId: 'r2', university: 'Đại học Y Dược' },
  { id: 's6', studentCode: 'SV006', name: 'Vũ Thị F', dob: '2003-06-01', gender: 'Female', phone: '0901234562', roomId: 'r2', university: 'Đại học Y Dược' },
  { id: 's7', studentCode: 'SV007', name: 'Đặng Văn G', dob: '2003-07-01', gender: 'Male', phone: '0901234563', roomId: 'r4', university: 'Đại học CNTT' },
  { id: 's8', studentCode: 'SV008', name: 'Bùi Văn H', dob: '2003-08-01', gender: 'Male', phone: '0901234564', roomId: 'r4', university: 'Đại học CNTT' },
  { id: 's9', studentCode: 'SV009', name: 'Đỗ Văn I', dob: '2003-09-01', gender: 'Male', phone: '0901234565', roomId: 'r4', university: 'Đại học Xây dựng' },
];

export const MOCK_ASSETS: Asset[] = [
    { id: 'a1', name: 'Điều hòa Daikin', roomId: 'r1', status: AssetStatus.GOOD, value: 5000000 },
    { id: 'a2', name: 'Giường tầng', roomId: 'r1', status: AssetStatus.GOOD, value: 2000000 },
    { id: 'a3', name: 'Bàn học gỗ', roomId: 'r1', status: AssetStatus.BROKEN, value: 500000 },
    { id: 'a4', name: 'Điều hòa Panasonic', roomId: 'r2', status: AssetStatus.REPAIRING, value: 5000000 },
    { id: 'a5', name: 'Quạt trần', roomId: 'r3', status: AssetStatus.GOOD, value: 300000 },
];

export const MOCK_BILLS: Bill[] = [
    { id: 'bill1', roomId: 'r1', month: '2023-10', electricIndexOld: 100, electricIndexNew: 150, waterIndexOld: 50, waterIndexNew: 60, roomFee: 2000000, totalAmount: 2275000, status: 'PAID', createdAt: '2023-10-01', dueDate: '2023-10-06' },
    { id: 'bill2', roomId: 'r2', month: '2023-10', electricIndexOld: 80, electricIndexNew: 100, waterIndexOld: 40, waterIndexNew: 45, roomFee: 2000000, totalAmount: 2120000, status: 'UNPAID', createdAt: '2023-10-01', dueDate: '2023-10-06' },
];

export const MOCK_GUESTS: Guest[] = [
    { id: 'g1', name: 'Nguyễn Thị Khách', cccd: '0123456789', relation: 'Chị gái', roomId: 'r2', checkInDate: '2023-10-25', checkOutDate: '2023-10-27' },
];
