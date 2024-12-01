import { Request, Response } from 'express';
import { User, UserRepository } from '../db';
import { sign } from 'jwt-smith';

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

	console.log({ user });

	if (!user || user.password !== password) {
		res.status(404).send({ message: 'User not found!' });
	} else {
		const tokenPayload = {
			payload: {
				user: {
					name: user.name,
					role: user.role,
				},
			},
			secret: process.env.ACCESS_TOKEN_SECRET || '',
			options: {
				expiresIn: '1m',
			},
		};

		const token = await sign(tokenPayload);

		res.cookie('accessToken', token, {
			maxAge: 300000,
			httpOnly: true,
		});

		res.status(200).send({ message: 'Sign In Complete', token });
	}
};

export const signOut = async (req: Request, res: Response) => {
	console.log('---- signOut');
	res.send('signOut');
};
