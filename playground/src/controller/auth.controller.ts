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
	console.log('---- signIn');
	console.log(req.body);
	const user = req.body;

	const tokenPayload = {
		payload: {
			user: {
				name: user.name,
			},
		},
		secret: process.env.ACCESS_TOKEN_SECRET || '',
		options: {
			expiresIn: '1m',
		},
	};

	const token = sign(tokenPayload);

	res.cookie('accessToken', token, {
		maxAge: 300000,
		httpOnly: true,
	});

	res.send('Sign In Complete');
};

export const signOut = async (req: Request, res: Response) => {
	console.log('---- signOut');
	res.send('signOut');
};
