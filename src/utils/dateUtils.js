import { getDay } from 'date-fns';
import { DAYS_OF_WEEK, WORK_HOURS } from '../config/constants.js';
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
      throw new Error(
        'No se pueden calcular horas para días no laborales (Domingo).'
      );
    case DAYS_OF_WEEK.SATURDAY:
      return WORK_HOURS.SATURDAY;
    default:
      return WORK_HOURS.WEEKDAY;
  }
};
