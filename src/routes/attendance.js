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
} from '../controllers/attendanceController.js';
import {
  getByDateSchema,
  getByWeekSchema,
  registerLeaveSchema,
  registerHolidaySchema,
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
router.get('/', protect, isAdmin, getAttendances);
router.get('/usuario/:id', protect, isAdmin, getAttendanceByUser);
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

// router.get('/semana/:week', getWeeklyReport);
router.post(
  '/feriado',
  protect,
  isAdmin,
  validateSchema(registerHolidaySchema),
  registerHoliday
);
router.delete('/feriado/:date', protect, isAdmin, deleteHoliday);

export default router;
