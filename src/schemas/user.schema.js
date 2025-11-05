import { z } from 'zod';

// ESQUEMA BASE

const paginationQuery = z.object({
  page: z.string().regex(/^\d+$/).default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).default('20').transform(Number),
});

const userFieldRules = {
  name: z.string().min(1, { message: 'El nombre es requerido' }),
  username: z
    .string()
    .min(3, {
      message: 'El nombre de usuario debe tener al menos 3 caracteres',
    })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        'El nombre de usuario solo puede contener letras, números y guiones',
    }),
  password: z
    .string()
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  email: z.string().email({ message: 'El correo electrónico no es válido' }),
  dni: z.string().regex(/^\d{8}$/, {
    message: 'El DNI debe contener 8 dígitos',
  }),
  phone: z.string().regex(/^\d{9}$/, {
    message: 'El teléfono debe contener 9 dígitos ',
  }),
  position: z.string().regex(/^[a-zA-Z\s]+$/, {
    message: 'El cargo solo puede contener letras y espacios',
  }),
  rol: z.enum(['employee', 'admin'], {
    message: 'El rol debe ser "employee" o "admin"',
  }),
  active: z.boolean(),
};

// ESQUEMAS GENERALES

// GET /api/usuarios
export const getUsersSchema = z.object({
  query: paginationQuery, // Solo soporta paginación
});

// GET /api/usuarios/inactive
export const getInactiveUsersSchema = z.object({
  query: paginationQuery, // Solo soporta paginación
});

// ESQUEMAS ESPECÍFICOS POR RUTA

// CreateUser Schema
export const createUserSchema = z.object({
  body: z.object({
    // Estos ya son requeridos por las reglas base
    name: userFieldRules.name,
    username: userFieldRules.username,
    password: userFieldRules.password,

    // Estos SÍ los queremos hacer opcionales
    email: userFieldRules.email.optional().nullable(),
    phone: userFieldRules.phone.optional().nullable(),
    dni: userFieldRules.dni.optional().nullable(),
    position: userFieldRules.position.optional().nullable(),

    // Este tiene un valor por defecto
    rol: userFieldRules.rol.default('employee'),
  }),
});

// UpdateUser Schema
export const updateUserSchema = z.object({
  body: z.object({
    name: userFieldRules.name.optional(),
    username: userFieldRules.username.optional(),
    password: userFieldRules.password.optional(),
    email: userFieldRules.email.optional().nullable(),
    phone: userFieldRules.phone.optional().nullable(),
    dni: userFieldRules.dni.optional().nullable(),
    position: userFieldRules.position.optional().nullable(),
    rol: userFieldRules.rol.optional(),
    active: userFieldRules.active.optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: 'El ID debe ser un número' }),
  }),
});

// UpdateMyProfile Schema
export const updateMyProfileSchema = z.object({
  body: z
    .object({
      name: userFieldRules.name.optional(),
      email: userFieldRules.email.optional().nullable(),
      phone: userFieldRules.phone.optional().nullable(),
      dni: userFieldRules.dni.optional().nullable(),
      position: userFieldRules.position.optional().nullable(),

      currentPassword: z
        .string({ required_error: 'La contraseña actual es requerida' })
        .min(1, { message: 'La contraseña actual es requerida' }),
      newPassword: userFieldRules.password.optional(),
    })
    .strict()
    .refine((data) => (data.newPassword ? data.currentPassword : true), {
      message:
        'Se requiere la contraseña actual para establecer una nueva contraseña',
      path: ['currentPassword'],
    }),
});
