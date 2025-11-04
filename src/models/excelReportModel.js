/***
 * Modelo para la exportación de reportes en Excel
 * @module models/excelReportModel
 * @param {Object} db - Instancia de la base de datos SQLite
 * @param {string} startDate - Fecha de inicio en formato 'YYYY-MM-DD'
 * @param {string} endDate - Fecha de fin en formato 'YYYY-MM-DD'
 * @returns {Promise<Array>} - Lista de registros de asistencias dentro del rango de fechas
 */
export async function exportExcelReport(db, startDate, endDate) {
  return db.all(
    `SELECT * FROM v_attendance_calculated 
    WHERE date BETWEEN ? AND ? 
    ORDER BY user_name ASC, date DESC`,
    [startDate, endDate]
  );
}
