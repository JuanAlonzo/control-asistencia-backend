import exceljs from 'exceljs';
import * as excelModel from '../models/excelReportModel.js';
import { format, parseISO } from 'date-fns';

export const exportExcelReport = async (req, res, next) => {
  const { startDate, endDate } = req.query; // Zod deberia validar esto

  try {
    const rawData = await excelModel.exportExcelReport(
      req.db,
      startDate,
      endDate
    );

    if (rawData.length === 0) {
      return res
        .status(404)
        .json({ error: 'No se encontraron datos en ese rango de fechas' });
    }

    const data = rawData.map((row) => ({
      ...row,
      date: parseISO(row.date),
      check_in: row.check_in ? parseISO(row.check_in) : null,
      check_out: row.check_out ? parseISO(row.check_out) : null,
    }));

    const workbook = new exceljs.Workbook();
    workbook.creator = 'SistemaDeAsistencia';
    workbook.lastModifiedBy = 'Admin';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Reporte de Asistencia');

    // Definir las columnas (Cabeceras)
    // El 'key' debe coincidir con el nombre de la columna de tu 'v_attendance_calculated'
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Empleado', key: 'user_name', width: 30 },
      { header: 'Usuario', key: 'user_username', width: 20 },
      {
        header: 'Fecha',
        key: 'date',
        width: 15,
        style: { numFmt: 'yyyy-mm-dd' },
      },
      {
        header: 'Entrada',
        key: 'check_in',
        width: 25,
        style: { numFmt: 'hh:mm:ss' }, // Formato de hora
      },
      {
        header: 'Salida',
        key: 'check_out',
        width: 25,
        style: { numFmt: 'hh:mm:ss' }, // Formato de hora
      },
      { header: 'Entrada', key: 'check_in', width: 25 },
      { header: 'Notas', key: 'description', width: 30 },
      { header: 'Horas Esperadas', key: 'expected_work_hours', width: 15 },
      { header: 'Horas Trabajadas', key: 'worked_hours', width: 15 },
      { header: 'Horas Extra', key: 'overtime_hours', width: 15 },
    ];

    // Añadir los datos (filas)
    // Usamos addRows (en plural) para un mejor rendimiento
    worksheet.addRows(data);

    // (Opcional) Poner la primera fila (cabeceras) en negrita
    worksheet.getRow(1).font = { bold: true };

    // Configurar la respuesta HTTP para descargar el archivo
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Reporte_Asistencia_${format(
        new Date(),
        'yyyyMMdd'
      )}.xlsx"`
    );

    // Enviar el archivo al cliente
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
