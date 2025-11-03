/** Middleware para manejar errores de forma centralizada
 * @param {*} err
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error stack:', err.stack);

  // Responder con un mensaje de error genérico
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
};

/**
 * Middleware para manejar rutas no encontradas (404)
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
};
