/***
 * Obtiene a todos los usuarios activos
 *  @param {Database} db - La conexión a la base de datos
 *  @param {Object} options - Opciones de paginación
 *  @param {number} [options.limit=20] - Límite de registros
 *  @param {number} [options.page=1] - Página actual
 *  @returns {Promise<Array>} - Lista de usuarios activos
 */
export async function getAllUsers(db, { limit = 20, page = 1 }) {
  const queryFields =
    'SELECT id, name, username, email, phone, dni, position, rol, active, created_at';

  // Consulta principal con paginación
  const query = `${queryFields} FROM users WHERE active = 1 ORDER BY name ASC LIMIT ? OFFSET ?`;

  // Consulta de conteo total
  const countQuery = 'SELECT COUNT(*) as total FROM users WHERE active = 1';

  const offset = (page - 1) * limit;
  const totalResult = await db.get(countQuery);
  const totalItems = totalResult.total;
  const totalPages = Math.ceil(totalItems / limit);

  const data = await db.all(query, [parseInt(limit), offset]);

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };
}

/***
 * Obtiene a todos los usuarios por ID
 * @param {Database} db - La conexión a la base de datos
 * @param {number} id - El ID del usuario a buscar
 * @returns {Promise<Object|null>} - El usuario encontrado o null si no existe
 */
export async function getUserById(db, id) {
  return db.get(
    'SELECT id, name, username, email, phone, dni, position, rol, active, created_at FROM users WHERE id = ? AND active = 1',
    [id]
  );
}

/***
 * Busca usuario por username (para login y validaciones)
 * @param {Database} db - La conexión a la base de datos
 * @param {string} username - El nombre de usuario a buscar
 * @returns {Promise<Object|null>} - El usuario encontrado o null si no existe
 */
export async function getUserByUsername(db, username) {
  return db.get(
    'SELECT id, name, username, email, phone, dni, position, password, rol, active FROM users WHERE username = ? AND active = 1',
    [username]
  );
}

/***
 * Buscar usuario por ID
 * @param {Database} db - La conexión a la base de datos
 * @param {number} id - El ID del usuario a buscar
 */
export async function findUserById(db, id) {
  return db.get('SELECT * FROM users WHERE id = ?', [id]);
}

/***
 * Obtener usuarios inactivos (administración)
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} options - Opciones de paginación
 * @param {number} [options.limit=20] - Límite de registros
 * @param {number} [options.page=1] - Página actual
 * @returns {Promise<Object>} - Objeto con { data, pagination }
 */
export async function findInactiveUsers(db, { limit = 20, page = 1 }) {
  const queryFields =
    'SELECT id, name, username, email, phone, dni, position, rol, created_at';

  const query = `${queryFields} FROM users WHERE active = 0 ORDER BY name ASC LIMIT ? OFFSET ?`;

  const countQuery = 'SELECT COUNT(*) as count FROM users WHERE active = 0';

  const offset = (page - 1) * limit;
  const totalResult = await db.get(countQuery);
  const totalItems = totalResult.count;
  const totalPages = Math.ceil(totalItems / limit);

  const data = await db.all(query, [parseInt(limit), offset]);

  return {
    data,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
    },
  };
}

/**
 * Buscar usuarios por rol
 * @param {Database} db - La conexión a la base de datos
 * @param {string} rol - El rol de los usuarios a buscar
 */
export async function findUsersByRole(db, rol) {
  return db.all(
    'SELECT id, name, username, email, phone, dni, position, rol, created_at FROM users WHERE rol = ? AND active = 1',
    [rol]
  );
}

/***
 * Crea un nuevo usuario
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} userData - Los datos del usuario a crear
 * @param {string} userData.name - Nombre del usuario
 * @param {string} userData.username - Nombre de usuario (único)
 * @param {string} userData.password - Contraseña hasheada
 * @param {string} [userData.email] - Email del usuario
 * @param {string} [userData.phone] - Teléfono del usuario
 * @param {string} [userData.dni] - DNI del usuario
 * @param {string} [userData.position] - Puesto del usuario
 * @param {string} [userData.rol] - Rol del usuario ('admin' o 'employee')
 * @returns {Promise<number>} - El ID del usuario creado
 */
export async function createUser(
  db,
  { name, username, password, email, phone, dni, position, rol = 'employee' }
) {
  const result = await db.run(
    'INSERT INTO users (name, username, password, email, phone, dni, position, rol) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, username, password, email, phone, dni, position, rol]
  );
  return result.lastID;
}

/***
 * Actualiza un usuario
 * @param {Database} db - La conexión a la base de datos
 * @param {Object} userData - Los datos del usuario a actualizar
 * @param {number} userData.id - ID del usuario
 * @param {string} [userData.name] - Nombre del usuario
 * @param {string} [userData.username] - Nombre de usuario (único)
 * @param {string} [userData.password] - Contraseña hasheada
 * @param {string} [userData.email] - Email del usuario
 * @param {string} [userData.phone] - Teléfono del usuario
 * @param {string} [userData.dni] - DNI del usuario
 * @param {string} [userData.position] - Puesto del usuario
 * @param {string} [userData.rol] - Rol del usuario ('admin' o 'employee')
 * @param {number} [userData.active] - Estado del usuario (1 = activo, 0 = inactivo)
 */
export async function updateUser(db, { id, ...data }) {
  const allowedFields = [
    'name',
    'username',
    'password',
    'email',
    'phone',
    'dni',
    'position',
    'rol',
    'active',
  ];

  // Filtra los campos de data para incluir solo los permitidos
  const fieldsToUpdate = Object.keys(data).filter(
    (key) => allowedFields.includes(key) && data[key] !== undefined
  );

  if (fieldsToUpdate.length === 0) {
    return { changes: 0 }; // Nada que actualizar
  }
  // Construye la consulta dinámica
  const setClause = fieldsToUpdate.map((key) => `${key} = ?`).join(', ');
  // Obtiene los valores correspondientes
  const values = fieldsToUpdate.map((key) => data[key]);

  // Agrega el id al final de los valores para la cláusula WHERE
  values.push(id);
  const query = `UPDATE users SET ${setClause} WHERE id = ?`;
  return db.run(query, values);
}

/***
 * Elimina un usuario (soft delete)
 *  @param {Database} db - La conexión a la base de datos
 *  @param {number} id - El ID del usuario a eliminar
 */
export async function softDeleteUser(db, id) {
  await db.run('UPDATE users SET active = 0 WHERE id = ?', [id]);
}

/***
 * Reactiva un usuario
 * @param {Database} db - La conexión a la base de datos
 * @param {number} id - El ID del usuario a reactivar
 */
export async function reactivateUser(db, id) {
  await db.run('UPDATE users SET active = 1 WHERE id = ?', [id]);
}

/***
 * Obtener usuarios activos (administración)
 * @param {Database} db - La conexión a la base de datos
 */
export async function countActiveUsers(db) {
  const result = await db.all(
    'SELECT COUNT(*) as count FROM users WHERE active = 1'
  );
  return result.count;
}
