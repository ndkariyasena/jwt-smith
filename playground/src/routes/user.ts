import { Router } from 'express';
import { getUserById, listUsers } from '../controller/user.controller';
import { validateJwtHeaderMiddleware } from 'jwt-smith';

const router = Router();

router.route('/').get(validateJwtHeaderMiddleware, listUsers);

router.route('/:id').get((req, res) => {
	console.log(Object.keys(req.header));
	console.log(Object.keys(req.headers));
}, getUserById);

export default router;
