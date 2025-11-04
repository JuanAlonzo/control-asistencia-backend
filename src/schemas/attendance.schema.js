import { z } from 'zod';

const validDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: 'La fecha debe estar en formato YYYY-MM-DD',
});

const validWeekString = z.string().regex(/^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/, {
  message: 'La semana debe estar en formato YYYY-W## (ej: 2025-W42)',
});

const validNumericId = z
  .string()
  .regex(/^\d+$/, { message: 'El ID debe ser numérico' });

// ESQUEMAS PARA CADA RUTA

// GET /api/asistencias/fecha/:date
export const getByDateSchema = z.object({
  params: z.object({
    date: validDateString,
  }),
});

// GET /api/asistencias/semana/:week
export const getByWeekSchema = z.object({
  params: z.object({
    week: validWeekString,
  }),
});

// POST /api/asistencias/feriado
export const registerHolidaySchema = z.object({
  body: z.object({
    date: validDateString, // Requerido
    description: z.string().optional(), // Opcional
  }),
});

// GET /api/asistencias/usuario/:id
export const getByUserSchema = z.object({
  params: z.object({
    id: validNumericId,
  }),
  query: z.object({
    start_date: validDateString.optional(),
    end_date: validDateString.optional(),
  }),
});

// POST /api/asistencias/homeoffice
export const logHomeOfficeSchema = z.object({
  body: z.object({
    date: validDateString.optional(), // La fecha es opcional
  }),
});

/**
 * Esquema para registrar licencias (Descanso Médico, Vacaciones, etc.)
 */
export const registerLeaveSchema = z.object({
  body: z.object({
    user_id: validNumericId.transform(Number), // Se convierte a número
    date: validDateString,
    status: z.enum(['descanso_medico', 'vacaciones', 'licencia'], {
      required_error:
        "El 'status' es requerido (descanso_medico, vacaciones, licencia)",
    }),
    description: z
      .string()
      .min(3, { message: 'La descripción debe tener al menos 3 caracteres' })
      .optional(),
  }),
});
