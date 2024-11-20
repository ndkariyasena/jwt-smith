import { Request, Response } from 'express';
import { userGenerator } from '../db/user.entity';
import { sign } from 'jwt-smith';

const insertUser = userGenerator();
insertUser.next();

export const signUp = async (req: Request, res: Response) => {
	console.log('---- signUp');
	console.log(req.body);
	const user = req.body;
	const userId = insertUser.next(user).value;

	res.send(`Sign In Complete for the user: ${userId}`);
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
