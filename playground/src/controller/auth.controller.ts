import { Request, Response } from 'express';
import { User, UserRepository } from '../db';
import { jwtTokenGenerator } from '../helper/jwt-token';

export const signUp = async (req: Request, res: Response) => {
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
	const { email, password } = req.body;
	const userRepo = new UserRepository();
	const user = await userRepo.getUser({ email });

	if (!user || user.password !== password) {
		res.status(404).send({ message: 'User not found!' });
	} else {
		const { token, refreshToken } = await jwtTokenGenerator({}, { id: user.id, role: user.role });

		res.cookie('accessToken', token, {
			maxAge: 1000 * 60 * 2,
			httpOnly: true,
		});

		res.cookie('refreshToken', refreshToken, {
			maxAge: 1000 * 60 * 30,
			httpOnly: true,
		});

		res.status(200).send({ message: 'Sign In Complete', token });
	}
};

export const signOut = async (req: Request, res: Response) => {
	res.send('signOut');
};
