import { Response } from 'express';
import { AuthedRequest } from 'jwt-smith';

export const listUsers = async (req: AuthedRequest, res: Response) => {
	console.log('[Playground] ListUsers endpoint hit successfully!');
	console.log(`[Playground] User details in the request object: ${JSON.stringify(req.user)}`);
	res.send('listUsers');
};

export const getUserById = async (req: AuthedRequest, res: Response) => {
	console.log('[Playground] GetUserById endpoint hit successfully!');
	console.log(`[Playground] User details in the request object: ${JSON.stringify(req.user)}`);
	res.send('userById');
};
