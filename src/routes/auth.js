import express from 'express';
import { login } from '../controllers/authController.js';
import { validateSchema } from '../middleware/validateSchema.js';
import { loginSchema } from '../schemas/auth.schema.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', validateSchema(loginSchema), login);

export default router;
