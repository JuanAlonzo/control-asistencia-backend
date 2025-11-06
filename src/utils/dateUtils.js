import { getDay } from 'date-fns';
import { DAYS_OF_WEEK, WORK_HOURS } from '../config/constants.js';

/**
 * Error personalizado para indicar que una fecha es un día no laboral.
 */
export class NonWorkDayError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NonWorkDayError';
  }
}

/**
 * Calcula las horas de trabajo esperadas para una fecha dada.
 * Arroja un error si es un día no laboral (ej. Domingo).
 *
 * @param {Date} dateObj - El objeto Date para el cual calcular las horas.
 * @returns {number} - Las horas de trabajo esperadas (ej: 8 o 5).
 * @throws {Error} - Si es un día no laboral (Domingo).
 */
export const getExpectedWorkHours = (dateObj) => {
  const dayOfWeek = getDay(dateObj); // 0 (Domingo) a 6 (Sábado)

  switch (dayOfWeek) {
    case DAYS_OF_WEEK.SUNDAY:
      throw new NonWorkDayError(
        'No se pueden calcular horas para días no laborales (Domingo).'
      );
    case DAYS_OF_WEEK.SATURDAY:
      return WORK_HOURS.SATURDAY;
    default:
      return WORK_HOURS.WEEKDAY;
  }
};

/**
 * Calcula el rango de fechas (lunes a domingo) para una semana ISO (YYYY-W##).
 * @param {string} weekString - La semana en formato 'YYYY-W##'.
 * @returns {{startDate: string, endDate: string}} - Rango de fechas.
 */
export const getWeekDateRange = (weekString) => {
  const [year, weekNumber] = weekString.split('-W').map(Number);

  // Calcula el primer día del año
  const firstDayOfYear = new Date(year, 0, 1);
  // Encuentra el primer lunes del año
  const dayToFirstMonday = (8 - firstDayOfYear.getDay()) % 7;
  const firstMonday = new Date(year, 0, 1 + dayToFirstMonday);

  // Calcula el lunes para la semana dada
  // (weekNumber - 1) porque la semana ya es el primer lunes
  const monday = new Date(firstMonday);
  monday.setDate(monday.getDate() + (weekNumber - 1) * 7);

  // Calcula el domingo de esa semana
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Formatea las fechas como 'YYYY-MM-DD'
  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];

  return { startDate, endDate };
};
