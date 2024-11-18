import { Router } from 'express';
import { getUserById, listUsers } from '../controller/user.controller';

const router = Router();

router.route('/')
    .get(listUsers)

router.route('/:id')
    .get(getUserById);

export default router;
