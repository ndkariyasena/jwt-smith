import { Response, NextFunction } from 'express';
import roleBasedAuthenticationMiddleware from '../src/middleware/role-based-authentication.middleware';
import { AuthedRequest } from '../src/lib/custom';
import { middlewareConfigs } from '../src/lib/core';
import * as fs from 'node:fs/promises';

jest.mock('node:fs/promises');
jest.mock('../src/lib/logger');
jest.mock('../src/lib/core', () => ({
	middlewareConfigs: {
		extractApiVersion: jest.fn(),
	},
}));

describe('> Role Based Authentication Middleware.', () => {
	let req: Partial<AuthedRequest>;
	let res: Partial<Response>;
	let next: NextFunction;

	beforeEach(() => {
		req = {
			baseUrl: '/api/test',
			method: 'GET',
			user: { role: 'admin' },
		};
		res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		next = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('01. Should throw an error if the permission configuration file is not found', async () => {
		(fs.stat as jest.Mock).mockRejectedValue(new Error('File not found'));

		const middleware = roleBasedAuthenticationMiddleware('read');
		await expect(middleware(req as AuthedRequest, res as Response, next)).rejects.toThrow('File not found');

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	it('02. Should call next if user has required permissions', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				endpoints: [
					{
						path: '/api/test',
						methods: ['GET'],
						permissions: [
							{
								roles: ['admin'],
								actions: ['read'],
							},
						],
					},
				],
			}),
		);

		const middleware = roleBasedAuthenticationMiddleware('read');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(next).toHaveBeenCalled();
	});

	it('03. Should return 403 if user role is not found', async () => {
		req.user = undefined;

		const middleware = roleBasedAuthenticationMiddleware('read');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Role not found.' });
	});

	it('04. Should return 403 if user does not have required permissions', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				endpoints: [
					{
						path: '/api/test',
						methods: ['GET'],
						permissions: [
							{
								roles: ['user'],
								actions: ['read'],
							},
						],
					},
				],
			}),
		);

		const middleware = roleBasedAuthenticationMiddleware('read');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Insufficient permissions.' });
	});

	it('05. Should return 400 if API version is not supported', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				versioned: true,
				activeVersions: ['v1'],
				endpoints: [
					{
						path: '/api/test',
						methods: ['GET'],
						permissions: [
							{
								roles: ['admin'],
								actions: ['read'],
							},
						],
					},
				],
			}),
		);
		(middlewareConfigs.extractApiVersion as jest.Mock).mockResolvedValue('v2');

		const middleware = roleBasedAuthenticationMiddleware('read');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'Unsupported API version.' });
	});

	it('06. Should return 400 if API version is missing when required', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				versioned: true,
				activeVersions: ['v1'],
				endpoints: [
					{
						path: '/api/test',
						methods: ['GET'],
						permissions: [
							{
								roles: ['admin'],
								actions: ['read'],
							},
						],
					},
				],
			}),
		);
		(middlewareConfigs.extractApiVersion as jest.Mock).mockResolvedValue(undefined);

		const middleware = roleBasedAuthenticationMiddleware('read');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(400);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Insufficient permissions.' });
	});

	it('07. Should throw an error if the permission configuration file validation fails', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				endpoints: [
					{
						path: '/api/test',
						methods: ['GET'],
						permissions: [
							{
								roles: ['admin'],
								actions: ['read'],
							},
						],
					},
				],
				invalidField: 'invalidValue', // Invalid field to cause validation failure
			}),
		);

		const middleware = roleBasedAuthenticationMiddleware('read');
		await expect(middleware(req as AuthedRequest, res as Response, next)).rejects.toThrow();

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	it('08. Should throw an error if the permission configuration file is empty', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue('');

		const middleware = roleBasedAuthenticationMiddleware('read');
		await expect(middleware(req as AuthedRequest, res as Response, next)).rejects.toThrow();

		expect(res.status).not.toHaveBeenCalled();
		expect(res.json).not.toHaveBeenCalled();
		expect(next).not.toHaveBeenCalled();
	});

	it('09. Should call next if user has required permissions in group-based routes', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				groups: {
					testGroup: {
						basePath: '/api',
						permissions: [
							{
								roles: ['admin'],
								actions: ['read'],
							},
						],
						endpoints: [
							{
								path: '/api/test',
								methods: ['GET'],
								permissions: [],
							},
						],
					},
				},
			}),
		);

		const middleware = roleBasedAuthenticationMiddleware('read');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(next).toHaveBeenCalled();
	});

	it('10. Should return 403 if user does not have required permissions in group-based routes', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				groups: {
					testGroup: {
						basePath: '/api',
						permissions: [
							{
								roles: ['user'],
								actions: ['read'],
							},
						],
						endpoints: [
							{
								path: '/api/test',
								methods: ['GET'],
								permissions: [],
							},
						],
					},
				},
			}),
		);

		const middleware = roleBasedAuthenticationMiddleware('read');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Insufficient permissions.' });
	});

	it('11. Should call next if user has required permissions in common configurations', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				common: {
					roles: [
						{
							name: 'admin',
							permissions: ['*:*'],
						},
					],
				},
			}),
		);

		const middleware = roleBasedAuthenticationMiddleware('read');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(next).toHaveBeenCalled();
	});

	it('12. Should return 403 if user does not have required permissions in common configurations', async () => {
		(fs.stat as jest.Mock).mockResolvedValue(true);
		(fs.readFile as jest.Mock).mockResolvedValue(
			JSON.stringify({
				common: {
					roles: [
						{
							name: 'user',
							permissions: ['read'],
						},
					],
				},
			}),
		);

		const middleware = roleBasedAuthenticationMiddleware('write');
		await middleware(req as AuthedRequest, res as Response, next);

		expect(res.status).toHaveBeenCalledWith(403);
		expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Insufficient permissions.' });
	});
});
