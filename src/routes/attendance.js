import express from 'express';
import {
  getAttendances,
  checkIn,
  checkOut,
  getAttendanceByUser,
  getAttendanceByDate,
  getWeeklySummary,
  registerHoliday,
  deleteHoliday,
  logHomeOffice,
  registerLeave,
  updateAttendance,
  seedAttendanceData,
} from '../controllers/attendanceController.js';
import {
  getByUserSchema,
  getByDateSchema,
  getByWeekSchema,
  getAttendancesSchema,
  registerLeaveSchema,
  registerHolidaySchema,
  updateAttendanceSchema,
} from '../schemas/attendance.schema.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (employees) - Se necesita estar logueado
router.post('/entrada', protect, checkIn);
router.post('/salida', protect, checkOut);
router.post('/homeoffice', protect, logHomeOffice);
router.get('/usuario/me', protect, getAttendanceByUser);

// Admin routes
router.get(
  '/',
  protect,
  isAdmin,
  validateSchema(getAttendancesSchema),
  getAttendances
);
router.get(
  '/usuario/:id',
  protect,
  isAdmin,
  validateSchema(getByUserSchema),
  getAttendanceByUser
);
router.get(
  '/fecha/:date',
  protect,
  isAdmin,
  validateSchema(getByDateSchema),
  getAttendanceByDate
);
router.get(
  '/semana/:week',
  protect,
  isAdmin,
  validateSchema(getByWeekSchema),
  getWeeklySummary
);
router.post(
  '/licencia',
  protect,
  isAdmin,
  validateSchema(registerLeaveSchema),
  registerLeave
);

router.put(
  '/:id',
  protect,
  isAdmin,
  validateSchema(updateAttendanceSchema),
  updateAttendance
);

// router.get('/semana/:week', getWeeklyReport);
router.post(
  '/feriado',
  protect,
  isAdmin,
  validateSchema(registerHolidaySchema),
  registerHoliday
);
router.delete('/feriado/:date', protect, isAdmin, deleteHoliday);

// --- RUTA DE DEBUG (SOLO ADMIN) ---
router.post('/debug-seed', protect, isAdmin, seedAttendanceData);

export default router;
