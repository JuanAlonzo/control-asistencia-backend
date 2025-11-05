import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initDB } from './database.js';
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import reportsRouter from './routes/reports.js';
import attendancesRouter from './routes/attendance.js';
import { errorHandler, notFoundHandler } from './utils/errorHandlers.js';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

let db;

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Demasiados intentos. Por favor, inténtelo de nuevo más tarde.',
});
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

(async () => {
  db = await initDB();

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Routes
  app.use('/api/auth', loginLimiter, authRouter);
  app.use('/api/usuarios', usersRouter);
  app.use('/api/asistencias', attendancesRouter);
  app.use('/api/reportes', reportsRouter);

  // Error handling middleware
  app.use(notFoundHandler);
  app.use(errorHandler);

  // Start the server
  const server = app.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down server...');
    await db.close();
    server.close(() => {
      console.log('Server closed and database connection terminated');
      process.exit(0);
    });
  });
})();
