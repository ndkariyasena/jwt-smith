import { Request, Response } from 'express';
import { AuthedRequest } from 'jwt-smith';

export const listUsers = async (req: AuthedRequest, res: Response) => {
	console.log('---- listUsers');
	console.log(req['user']);
	res.send('listUsers');
};

export const getUserById = async (req: Request, res: Response) => {
	console.log('---- userById');
	res.send('userById');
};
