import { Router } from 'express';
import { signUp, signIn, signOut } from '../controller/auth.controller';

const router = Router();

router.route('/signup').post(signUp);

router.route('/signin').post(signIn);

router.route('/signout').get(signOut);

export default router;
