import { z } from 'zod';

export const loginSchema = z.object({
  body: z
    .object({
      username: z
        .string({ required_error: 'El username es requerido' })
        .min(1, 'El username es requerido'),
      password: z
        .string({ required_error: 'La contraseña es requerida' })
        .min(1, 'La contraseña es requerida'),
    })
    .strict(),
});
