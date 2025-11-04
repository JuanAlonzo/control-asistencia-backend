/**
 * Obtener todas las asistencias con cálculos automáticos (filtros)
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} filters - Filtros opcionales
 * @param {string} [filters.date] - Fecha específica (YYYY-MM-DD)
 * @param {number} [filters.user_id] - ID del usuario
 * @param {number} [filters.limit=100] - Límite de registros a retornar
 */
export async function getAllAttendances(db, { date, user_id, limit = 100 }) {
  let query = 'SELECT * FROM v_attendance_calculated WHERE 1=1';
  const params = [];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }

  if (user_id) {
    query += ' AND user_id = ?';
    params.push(user_id);
  }

  query += ' ORDER BY date DESC, check_in DESC LIMIT ?';
  params.push(parseInt(limit));

  return db.all(query, params);
}

/**
 * Obtener asistencia por ID
 * @param {Database} db - La conexión a la base de datos
 * @param {number} id - ID de la asistencia
 */
export async function getAttendanceById(db, id) {
  return db.get('SELECT * FROM v_attendance_calculated WHERE id = ?', [id]);
}

/**
 * Obtener historial de un usuario
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} options - Opciones de búsqueda
 * @param {number} options.user_id - ID del usuario
 * @param {string} [options.startDate] - Fecha de inicio (YYYY-MM-DD)
 * @param {string} [options.endDate] - Fecha de fin (YYYY-MM-DD)
 * @param {number} [options.limit=100] - Límite de registros a retornar
 */
export async function getAttendanceByUserId(
  db,
  { user_id, startDate, endDate, limit = 100 }
) {
  let query = 'SELECT * FROM v_attendance_calculated WHERE user_id = ?';
  const params = [user_id];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY date DESC LIMIT ?';
  params.push(parseInt(limit));

  return db.all(query, params);
}

/**
 * Registrar entrada de asistencia
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} attendanceData - Datos de la asistencia
 * @param {number} attendanceData.user_id - ID del usuario
 * @param {string} attendanceData.date - Fecha de la asistencia (YYYY-MM-DD)
 * @param {string} attendanceData.checkInTime - Hora de entrada (HH:MM:SS)
 * @param {number} attendanceData.expected_work_hours - Horas de trabajo esperadas
 */
export async function logCheckIn(
  db,
  { user_id, date, checkInTime, expected_work_hours }
) {
  // 'status' toma su valor DEFAULT ('presente') automáticamente
  return db.run(
    `INSERT INTO attendance (user_id, date, check_in, expected_work_hours) 
    VALUES (?, ?, ?, ?)`,
    [user_id, date, checkInTime, expected_work_hours]
  );
}

/**
 * Registrar salida de asistencia
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} attendanceData - Datos de la asistencia
 * @param {string} attendanceData.checkOutTime - Hora de salida (HH:MM:SS)
 * @param {number} attendanceData.attendanceId - ID de la asistencia a actualizar
 */
export async function logCheckOut(db, { checkOutTime, attendanceId }) {
  // El trigger se encargará de actualizar el campo updated_at
  return db.run(
    `UPDATE attendance 
     SET check_out = ?, state = 'closed' 
     WHERE id = ?`,
    [checkOutTime, attendanceId]
  );
}

/**
 * Buscar asistencia abierta del día
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} params.user_id - ID del usuario
 * @param {string} params.date - Fecha de la asistencia (YYYY-MM-DD)
 */
export async function findOpenAttendance(db, { user_id, date }) {
  return db.get(
    `SELECT id, check_in, check_out, state 
     FROM attendance 
     WHERE user_id = ? AND date = ?`,
    [user_id, date]
  );
}

/**
 * Verificar si ya existe asistencia para la fecha
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} params - Parámetros de búsqueda
 * @param {number} params.user_id - ID del usuario
 * @param {string} params.date - Fecha de la asistencia (YYYY-MM-DD)
 */
export async function existsAttendance(db, { user_id, date }) {
  const result = await db.get(
    'SELECT COUNT(*) as count FROM attendance WHERE user_id = ? AND date = ?',
    [user_id, date]
  );
  // Retorna true si count > 0
  return result.count > 0;
}

/**
 * Obtener asistencias de un usuario específico
 * @param {Database} db - La conexión a la base de datos
 * @param {number} user_id - ID del usuario
 */
export async function getAttendanceUser(db, user_id) {
  return db.all('SELECT * FROM attendance WHERE user_id = ?', [user_id]);
}

/**
 * Obtener todos los IDs de usuarios activos
 * @param {Database} db - La conexión a la base de datos
 * @return {Promise<number[]>} - Lista de IDs de usuarios activos
 */
export async function findAllActiveUserIds(db) {
  const users = await db.all('SELECT id FROM users WHERE active = 1');
  return users.map((u) => u.id);
}

/**
 * Resumen semanal de todos los empleados
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} options - Opciones de búsqueda
 * @param {string} options.startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} options.endDate - Fecha de fin (YYYY-MM-DD)
 */
export async function getWeeklySummary(db, { startDate, endDate }) {
  return db.all(
    `SELECT
      u.id,
      u.name,
      u.username,
      COUNT(a.id) AS days_attended,
      COALESCE(SUM(a.worked_hours), 0) as total_hours,
      COALESCE(SUM(a.overtime_hours), 0) as total_overtime
    FROM users u
    LEFT JOIN v_attendance_calculated a ON u.id = a.user_id 
      AND a.date BETWEEN ? AND ?
    WHERE u.active = 1
    GROUP BY u.id
    ORDER BY u.name`,
    [startDate, endDate]
  );
}

/**
 * Registrar feriado para todos los empleados activos
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} holidayData - Datos del feriado
 * @param {string} holidayData.date - Fecha del feriado (YYYY-MM-DD)
 * @param {string} [holidayData.description='FERIADO'] - Descripción del feriado
 */
export async function registerHolidayForAll(
  db,
  { date, description, expected_work_hours }
) {
  const users = await db.all('SELECT id FROM users WHERE active = 1');
  if (users.length === 0) {
    return { inserted: 0 };
  }
  try {
    await db.exec('BEGIN');
    // Preparar la inserción para optimizar múltiples inserciones
    const stmt = await db.prepare(
      `INSERT INTO attendance (user_id, date, state, status, description, expected_work_hours) 
       VALUES (?, ?, 'closed', 'feriado', ?, ?)`
    );
    // Se itera sobre todos los usuarios activos y se inserta el registro de feriado
    for (const user of users) {
      await stmt.run(user.id, date, description, expected_work_hours);
    }
    await stmt.finalize();
    await db.exec('COMMIT');
    return { inserted: users.length };
  } catch (error) {
    await db.exec('ROLLBACK');
    console.error('Error registering holiday for all users:', error);
    throw error;
  }
}

/**
 * Eliminar feriado (por si se registró por error)
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} params - Parámetros para eliminar el feriado
 * @param {string} params.date - Fecha del feriado a eliminar (YYYY-MM-DD)
 */
export async function deleteHoliday(db, { date }) {
  const result = await db.run(
    `DELETE FROM attendance
     WHERE date = ? AND status = 'feriado'`,
    [date]
  );
  return result.changes;
}

/**
 * Obtener asistencias de un rango de fechas (para reportes/exportación)
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} params - Parámetros de búsqueda
 * @param {string} params.startDate - Fecha de inicio (YYYY-MM-DD)
 * @param {string} params.endDate - Fecha de fin (YYYY-MM-DD)
 */
export async function findAttendancesByDateRange(db, { startDate, endDate }) {
  return db.all(
    `SELECT * FROM v_attendance_calculated 
     WHERE date BETWEEN ? AND ?
     ORDER BY user_name, date`,
    [startDate, endDate]
  );
}

/**
 * Estadísticas generales del sistema
 * @param {Database} db - La conexión a la base de datos
 * @return {Promise<Object>} - Objeto con las estadísticas
 */
export async function getSystemStats(db) {
  const stats = await db.get(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE active = 1) as total_users,
      (SELECT COUNT(*) FROM attendance WHERE date = DATE('now')) as today_attendances,
      (SELECT COUNT(*) FROM attendance WHERE date = DATE('now') AND check_out IS NOT NULL) as today_completed,
      (SELECT COALESCE(SUM(overtime_hours), 0) FROM v_attendance_calculated WHERE date >= DATE('now', '-7 days')) as week_overtime
  `);

  return stats;
}

/** Registrar día de home office
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} params - Parámetros para registrar home office
 * @param {number} params.user_id - ID del usuario
 * @param {string} params.date - Fecha del home office (YYYY-MM-DD)
 * @param {number} params.expected_work_hours - Horas de trabajo esperadas
 */
export async function logHomeOffice(
  db,
  { user_id, date, expected_work_hours }
) {
  return db.run(
    `INSERT INTO attendance (user_id, date, state, status, description, expected_work_hours)
     VALUES (?, ?, 'closed', 'home_office', 'HOME_OFFICE', ?)`,
    [user_id, date, expected_work_hours]
  );
}

/** * NUEVA FUNCIÓN: Registrar Licencia (Descanso Médico, etc.)
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} params - Parámetros
 * @param {number} params.user_id - ID del usuario
 * @param {string} params.date - Fecha (YYYY-MM-DD)
 * @param {string} params.status - 'descanso_medico', 'vacaciones', 'licencia'
 * @param {string} [params.description] - Razón (ej. "Gripe")
 * @param {number} params.expected_work_hours - Horas esperadas
 */
export async function logLeave(
  db,
  { user_id, date, status, description, expected_work_hours }
) {
  return db.run(
    `INSERT INTO attendance (user_id, date, state, status, description, expected_work_hours)
     VALUES (?, ?, 'closed', ?, ?, ?)`,
    [user_id, date, status, description, expected_work_hours]
  );
}
