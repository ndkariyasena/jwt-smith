import { Request, Response } from 'express';
import { TokenRepository, User, UserRepository } from '../db';
import { jwtTokenGenerator } from '../helper/jwt-token';
import { COOKIE_TOKEN_EXPIRES_DEFAULT as Default_Expires } from '../common/constants';

export const signUp = async (req: Request, res: Response) => {
	console.log('[Playground] SignUp endpoint hit successfully!');
	const userData: User = req.body;
	const user = new UserRepository();

	await user
		.saveUser(userData)
		.then(({ id }) => {
			console.debug('User insert successful!');
			res.status(201).send({ message: 'Sign In Complete', userId: id });
		})
		.catch((error) => {
			res.status(403).send({ message: 'User insert failed!', error: error.message });
		});
};

export const signIn = async (req: Request, res: Response) => {
	console.log('[Playground] SignIn endpoint hit successfully!');
	const { email, password } = req.body;
	const userRepo = new UserRepository();
	const user = await userRepo.getUser({ email });

	if (!user || user.password !== password) {
		res.status(404).send({ message: 'User not found!' });
	} else {
		const { token, refreshToken } = await jwtTokenGenerator({}, { id: user.id, role: user.role });

		const tokenHandler = new TokenRepository();
		tokenHandler.saveOrUpdateToken(user.id, token, refreshToken);

		res.cookie('refreshToken', refreshToken, {
			maxAge: parseInt(process.env.REFRESH_COOKIE_EXPIRES || Default_Expires, 10),
			httpOnly: true,
		});

		res.status(200).send({ message: 'Sign In Complete', token });
	}
};

export const signOut = async (req: Request, res: Response) => {
	console.log('[Playground] SignOut endpoint hit successfully!');
	res.send('signOut');
};
