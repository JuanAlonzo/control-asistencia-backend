import express from 'express';
import { exportExcelReport } from '../controllers/exportExcelReportController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Ruta para exportar reporte de reportes a Excel
router.get('/reporte/excel', protect, isAdmin, exportExcelReport);

export default router;
