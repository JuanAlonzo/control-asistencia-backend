import express from 'express';
import { exportExcelReport } from '../controllers/exportExcelReportController.js';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { excelReportSchema } from '../schemas/report.schema.js';

const router = express.Router();

// Ruta para exportar reporte de reportes a Excel
router.get(
  '/reporte/excel',
  protect,
  isAdmin,
  validateSchema(excelReportSchema),
  exportExcelReport
);

export default router;
