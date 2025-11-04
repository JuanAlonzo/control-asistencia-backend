import { z } from 'zod';

/**
 * Middleware de validación de esquemas de Zod.
 * @param {z.ZodSchema<any>} schema - El esquema de Zod a validar.
 * @returns {Function} - El middleware de Express.
 */
export const validateSchema = (schema) => async (req, res, next) => {
  try {
    // Parsea y valida la data de la request (body, params, query)
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    // Si todo está bien, continúa al siguiente middleware/controlador
    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      return res.status(400).json({
        errors: errorMessages,
      });
    }
    return next(error);
  }
};
