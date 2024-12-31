import { Router } from 'express';
import { getUserById, listUsers } from '../controller/user.controller';
import { roleBasedAuthenticationMiddleware, validateJwtHeaderMiddleware } from 'jwt-smith';

const router = Router();

router.route('/').get(validateJwtHeaderMiddleware, roleBasedAuthenticationMiddleware('users:list'), listUsers);

router.route('/:id').get(validateJwtHeaderMiddleware, getUserById);

export default router;
