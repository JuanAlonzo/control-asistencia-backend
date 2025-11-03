import express from 'express';
import cors from 'cors';
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

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

let db;

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

(async () => {
  db = await initDB();

  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Routes
  app.use('/api/auth', authRouter);
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
