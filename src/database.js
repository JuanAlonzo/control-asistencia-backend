import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Open a database connection
export const initDB = async () => {
  const db = await open({
    filename: './database/assistance.db',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      dni TEXT,
      position TEXT,
      rol TEXT DEFAULT 'employee' CHECK(rol IN ('admin', 'employee')),
      active INTEGER DEFAULT 1 CHECK(active IN (0,1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Create default admin user if not exists
  if (adminUsername && adminPassword) {
    const userCount = await db.get(`SELECT COUNT(*) as count FROM users`);

    if (userCount.count === 0) {
      console.log('Database empty. Creating default admin user...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await db.run(
        `INSERT INTO users (name, username, password, rol) VALUES (?, ?, ?, ?)`,
        ['Admin', adminUsername, hashedPassword, 'admin']
      );
      console.log(`Default admin user created with username: ${adminUsername}`);
    }
  }

  // Index for username uniqueness
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)
  `);

  // Trigger to update updated_at on users table
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS trigger_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      check_in DATETIME,
      check_out DATETIME,
      -- NUEVAS COLUMNAS --
      status TEXT NOT NULL DEFAULT 'presente' CHECK(
        status IN (
          'presente',      -- Marcó entrada/salida
          'home_office',   -- Jornada de teletrabajo
          'feriado',       -- Feriado calendario
          'descanso_medico', -- Licencia médica
          'vacaciones',    -- Vacaciones
          'licencia'       -- Otro tipo de licencia (paternidad, etc.)
        )
      ),
      description TEXT, -- Para notas (ej. "Gripe", "Navidad", etc.)
      state TEXT DEFAULT 'opened' CHECK(state IN ('opened', 'closed')),
      expected_work_hours REAL NOT NULL DEFAULT 8,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
      UNIQUE(user_id, date)
    )
  `);

  // Indexes for performance optimization
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_user_date 
    ON attendance (user_id, date DESC)  
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_date 
    ON attendance (date DESC)
  `);

  // Trigger to update updated_at on attendance table
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS trigger_attendance_updated_at
    AFTER UPDATE ON attendance
    FOR EACH ROW
    BEGIN
        UPDATE attendance SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
    END;
  `);

  // Logica para calcular las horas trabajadas al hacer check-out
  await db.exec(`
    CREATE VIEW IF NOT EXISTS v_attendance_calculated AS

    -- 1. Definimos los tiempos "Efectivos" primero
    WITH effective_times AS (
      SELECT
        a.*,
        -- Logica de Margen de Tolerancia para Check-In (15 min)
        CASE
          -- Si marco entre 8:00 y 8:15, se le considera que marco a las 8:00
          WHEN TIME(a.check_in) > '08:00:00' AND TIME(a.check_in) <= '08:15:00'
          THEN DATETIME(DATE(a.check_in), '08:00:00')
          -- Si no, usa la hora real
          ELSE a.check_in
        END AS effective_check_in,

        -- Dejamos el check-out igual (no hay tolerancia al salir)
        a.check_out AS effective_check_out

      FROM attendance a
    )
    -- 2. Hacemos los calculos con la nueva logica de 'status'
    SELECT
      t.id, t.user_id, t.date, t.check_in, t.check_out, t.state, 
      t.status, -- NUEVO CAMPO 'status'
      t.description, -- NUEVO CAMPO 'description'
      t.expected_work_hours,
      u.name AS user_name,
      u.username AS user_username,

      -- ---- LÓGICA DE HORAS TRABAJADAS (ACTUALIZADA) ----

      CASE
        -- CASO 1: Feriado o Home Office cuentan como la jornada completa
        WHEN t.status IN ('home_office', 'feriado') THEN t.expected_work_hours
        
        -- CASO 2: Es un día 'presente' y marcó salida
        WHEN t.status = 'presente' AND t.effective_check_out IS NOT NULL THEN
          -- Calculamos horas transcurridas (usando el check-in "efectivo")
          (CASE
          -- Jornada larga (más de 6h) -> Restamos 1h de refrigerio
            WHEN (JULIANDAY(t.effective_check_out) - JULIANDAY(t.effective_check_in)) * 24 > 6
            THEN ROUND(((JULIANDAY(t.effective_check_out) - JULIANDAY(t.effective_check_in)) * 24) - 1, 2)
            -- Jornada corta (6h o menos) -> No hay refrigerio
            ELSE ROUND((JULIANDAY(t.effective_check_out) - JULIANDAY(t.effective_check_in)) * 24, 2)
          END)
          
        -- CASO 3: Descanso médico, vacaciones, o presente sin marcar salida = 0 horas
        ELSE 0
      END AS worked_hours,

      -- ---- LÓGICA DE HORAS EXTRA (ACTUALIZADA) ----
      CASE
        -- Un feriado nunca genera horas extra
        WHEN t.status = 'presente' AND t.effective_check_out IS NOT NULL THEN
          MAX(0,
            (CASE
              WHEN (JULIANDAY(t.effective_check_out) - JULIANDAY(t.effective_check_in)) * 24 > 6
              THEN ROUND(((JULIANDAY(t.effective_check_out) - JULIANDAY(t.effective_check_in)) * 24) - 1, 2)
              ELSE ROUND((JULIANDAY(t.effective_check_out) - JULIANDAY(t.effective_check_in)) * 24, 2)
            END)
            -- Y le restamos las horas esperadas (8 para L-V, 5 para Sábado)
            - t.expected_work_hours
          )
          
        -- Si no, no hay horas extra
        ELSE 0
      END AS overtime_hours,

      -- ---- LÓGICA DE OBSERVACIONES (NUEVA) ----
      CASE
        WHEN t.status = 'feriado' THEN 'FERIADO'
        WHEN t.status = 'home_office' THEN 'HOME OFFICE'
        WHEN t.status = 'descanso_medico' THEN 'DESCANSO MÉDICO'
        WHEN t.status = 'vacaciones' THEN 'VACACIONES'
        WHEN t.status = 'licencia' THEN 'LICENCIA'
        WHEN t.status = 'presente' AND t.check_in IS NULL THEN 'ERROR (PRESENTE SIN DATA)'
        WHEN t.status = 'presente' AND t.check_out IS NULL THEN 'PENDIENTE DE SALIDA'
        WHEN t.status = 'presente' AND TIME(t.check_in) > '08:15:00' THEN 'TARDANZA'
        WHEN t.status = 'presente' THEN 'OK'
        ELSE t.status -- Fallback
      END AS observations -- ESTA ES LA COLUMNA QUE USARÁ EL REPORTE EXCEL

    FROM effective_times t
    INNER JOIN users u ON t.user_id = u.id;
  `);

  console.log('Database initialized');
  return db;
};
