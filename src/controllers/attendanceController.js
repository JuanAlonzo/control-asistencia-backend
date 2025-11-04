import * as AttendanceModel from '../models/attendanceModel.js';
import { format, getDay, parseISO } from 'date-fns';
import { getExpectedWorkHours } from '../utils/dateUtils.js';

/**
 * Registrar entrada de asistencia
 */
// POST /api/asistencias/entrada
export const checkIn = async (req, res, next) => {
  const { id: user_id } = req.user;
  try {
    const now = new Date();
    const date = format(now, 'yyyy-MM-dd'); // 2025-10-25
    const checkInTime = now.toISOString(); // '2025-10-25T08:30:00.000Z'

    const expected_work_hours = getExpectedWorkHours(now);

    const result = await AttendanceModel.logCheckIn(req.db, {
      user_id,
      date,
      checkInTime,
      expected_work_hours,
    });

    res.status(201).json({
      message: 'Check-in registrado exitosamente',
      attendanceId: result.lastID,
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error: 'Check-in ya registrado para hoy',
      });
    }
    if (error.message.includes('días no laborales (Domingo)')) {
      return res.status(400).json({
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * Registrar salida de asistencia
 */
// POST /api/asistencias/salida
export const checkOut = async (req, res, next) => {
  const { id: user_id } = req.user;

  try {
    const date = format(new Date(), 'yyyy-MM-dd');
    const attendance = await AttendanceModel.findOpenAttendance(req.db, {
      user_id,
      date,
    });

    if (!attendance) {
      return res.status(404).json({
        error:
          'No se encontró ningún registro de entrada para hoy o ya se ha realizado el check-out.',
      });
    }

    if (attendance.check_out) {
      return res.status(400).json({
        error: 'El usuario ya ha realizado el check-out hoy',
        check_out: attendance.check_out,
      });
    }

    const checkOutTime = new Date().toISOString();

    // Update attendance with check-out time
    await AttendanceModel.logCheckOut(req.db, {
      checkOutTime,
      attendanceId: attendance.id,
    });

    const finalRecord = await AttendanceModel.getAttendanceById(
      req.db,
      attendance.id
    );

    res.json({
      message: 'Check-out registrado exitosamente',
      record: finalRecord,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar home office
 * Registra una jornada completa de home office (ENFOQUE FLEXIBLE)
 */
// POST /api/asistencias/homeoffice
export const logHomeOffice = async (req, res, next) => {
  const { id: user_id } = req.user;
  // Permite que el usuario envíe una fecha (ej. 'YYYY-MM-DD') si no, usa la fecha de hoy.
  const { date: dateString } = req.body;

  try {
    const dateObj = dateString ? parseISO(dateString) : new Date();
    const date = format(dateObj, 'yyyy-MM-dd');

    const expected_work_hours = getExpectedWorkHours(dateObj);

    const result = await AttendanceModel.logHomeOffice(req.db, {
      user_id,
      date,
      expected_work_hours,
    });

    res.status(201).json({
      message: 'Registro de Home Office guardado exitosamente.',
      attendanceId: result.lastID,
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error:
          'Ya existe un registro de asistencia para este usuario en esa fecha',
      });
    }
    if (error.message.includes('días no laborales (Domingo)')) {
      return res.status(400).json({
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * Historial de asistencias de un usuario
 */
// GET /api/asistencias/usuario/:id (O /me)
export const getAttendanceByUser = async (req, res, next) => {
  let user_id;
  if (req.params.id) {
    // Si viene un ID en la URL, es un admin consultando (la ruta /usuario/:id)
    user_id = req.params.id;
  } else {
    // Si no, es el propio usuario consultando sus datos (/usuario/me)
    user_id = req.user.id;
  }

  const { start_date, end_date } = req.query;

  try {
    const records = await AttendanceModel.getAttendanceByUserId(req.db, {
      user_id: user_id,
      startDate: start_date,
      endDate: end_date,
      limit: 100, // Opcional
    });

    if (!records || records.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron registros de asistencia para este usuario.',
      });
    }
    res.json(records);
  } catch (error) {
    next(error);
  }
};

/**
 * Asistencias por fecha (todos los usuarios)
 */
// GET /api/asistencias/fecha/:date
export const getAttendanceByDate = async (req, res, next) => {
  const { date } = req.params;

  try {
    const records = await AttendanceModel.getAllAttendances(req.db, {
      date: date,
    });

    if (!records || records.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron registros de asistencia para esta fecha.',
      });
    }
    res.json(records);
  } catch (error) {
    next(error);
  }
};

/**
 * Resumen semanal (todos los usuarios)
 */
// GET /api/asistencias/semana/:week
export const getWeeklySummary = async (req, res, next) => {
  const { week } = req.params; // Format: 'YYYY-WW' (ej. '2025-W23')

  try {
    const [year, weekNumber] = week.split('-W');

    const firstDay = new Date(year, 0, 1 + (weekNumber - 1) * 7);
    const dayOfWeek = firstDay.getDay();
    const monday = new Date(firstDay);
    monday.setDate(firstDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const start_date = monday.toISOString().split('T')[0];
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const end_date = sunday.toISOString().split('T')[0];

    const summary = await AttendanceModel.getWeeklySummary(req.db, {
      startDate: start_date,
      endDate: end_date,
    });

    res.json({
      week,
      period: {
        start: start_date,
        end: end_date,
      },
      employees: summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar feriado para todos los empleados (only admin)
 */
// POST /api/asistencias/feriado
export const registerHoliday = async (req, res, next) => {
  const { date, description = 'FERIADO' } = req.body;

  try {
    const dateObj = parseISO(date); // '2025-12-25' a Date

    const expected_work_hours = getExpectedWorkHours(dateObj);

    const result = await AttendanceModel.registerHolidayForAll(req.db, {
      date,
      description,
      expected_work_hours,
    });

    res.status(201).json({
      message: `Feriado registrado exitosamente para ${result.inserted} empleados`,
      date: date,
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error:
          'Ya existe un registro (feriado u otro) para uno o más usuarios en esa fecha',
      });
    }
    next(error);
  }
};

/**
 *  Eliminar feriado (only admin)
 */
// DELETE /api/asistencias/feriado/:date
export const deleteHoliday = async (req, res, next) => {
  const { date } = req.params; // La fecha viene de la URL

  if (!date) {
    return res
      .status(400)
      .json({ error: 'La fecha del feriado es requerida en la URL' });
  }

  try {
    const changes = await AttendanceModel.deleteHoliday(req.db, { date });

    if (changes === 0) {
      return res.status(404).json({
        error: 'No se encontró un feriado para eliminar en esa fecha',
      });
    }
    res.json({
      message: `Feriado eliminado exitosamente para la fecha ${date}`,
      date: date,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Listar todas las asistencias (para admin)
 */
// GET /api/asistencias
export const getAttendances = async (req, res, next) => {
  const { date, user_id, limit = 100 } = req.query;

  try {
    const attendances = await AttendanceModel.getAllAttendances(req.db, {
      date,
      user_id,
      limit,
    });
    res.json(attendances);
  } catch (error) {
    next(error);
  }
};

/**
 * Registrar Licencia (DM, Vacaciones, etc.)
 */
// POST /api/asistencias/licencia
export const registerLeave = async (req, res, next) => {
  const { user_id, date, status, description } = req.body; // Zod ya validó y limpió los datos

  try {
    const dateObj = parseISO(date);
    const expected_work_hours = getExpectedWorkHours(dateObj);

    const result = await AttendanceModel.logLeave(req.db, {
      user_id,
      date,
      status, // 'descanso_medico', 'vacaciones', etc.
      description, // "Gripe", "Cita programada", etc.
      expected_work_hours,
    });

    res.status(201).json({
      message: `Licencia (${status}) registrada exitosamente.`,
      attendanceId: result.lastID,
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({
        error:
          'Ya existe un registro de asistencia para este usuario en esa fecha.',
      });
    }
    // Captura el error de 'getExpectedWorkHours'
    if (error.message.includes('días no laborales (Domingo)')) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
};

/**
 * Estadísticas generales del sistema (DASHBOARD)
 */
// GET /api/asistencias/stats
export const getAttendanceStats = async (req, res, next) => {
  try {
    const stats = await AttendanceModel.getSystemStats(req.db);
    res.json(stats);
  } catch (error) {
    next(error);
  }
};
