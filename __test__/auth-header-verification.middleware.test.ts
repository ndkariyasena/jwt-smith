import { NextFunction, Response } from 'express';
import validateJwtHeaderMiddleware from '../src/middleware/auth-header-verification.middleware';
import DefaultTokenStorage from '../src/module/token-storage';
import { AuthedRequest } from '../src/lib/custom';
import { configure } from '../src/lib/core';
import { sign } from '../src/lib/signing-token';

jest.mock('../src/lib/logger', () => ({
	log: jest.fn(),
}));

const Secret = 'SupperPass123';
const userId = '1234';

const createAuthToken = async (options = {}, payload = {}): Promise<string> => {
	const token = (await sign({
		payload,
		secret: Secret,
		options,
	})) as unknown as string;

	return token;
};

describe('> Auth Header Verification Middleware.', () => {
	let mockRequest: Partial<AuthedRequest>;
	let mockResponse: Partial<Response>;
	let mockNext: jest.Mock<NextFunction>;

	beforeEach(() => {
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
			setHeader: jest.fn(),
			cookie: jest.fn(),
			sendStatus: jest.fn(),
		};
		mockNext = jest.fn();

		configure({
			publicKey: Secret,
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();

		configure({});
	});

	it('01. should throw an error if the auth header is not found.', async () => {
		mockRequest.headers = {};

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized', error: 'Valid auth header not found' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('02. should throw an error if the auth header does not start with "Bearer ".', async () => {
		const authHeaderName = 'authorization';
		mockRequest.headers = {
			[authHeaderName]: 'TBearer xxx.yyy.zzz',
		};

		configure({
			middlewareConfigs: {
				authHeaderName,
				tokenGenerationHandler: jest.fn(),
			},
		});

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized', error: 'Valid auth header not found' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('03. should throw an error if the auth token value is not found.', async () => {
		const authHeaderName = 'authorization';
		mockRequest.headers = {
			[authHeaderName]: 'Bearer ',
		};

		configure({
			middlewareConfigs: {
				authHeaderName,
				tokenGenerationHandler: jest.fn(),
			},
		});

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized', error: 'Auth token not found' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('04. should throw an error if the token expired and the refresh token is not found.', async () => {
		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId } });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const authHeaderName = 'authorization';

		mockRequest.headers = {
			[authHeaderName]: `Bearer ${token}`,
		};

		configure({
			middlewareConfigs: {
				authHeaderName,
				tokenGenerationHandler: jest.fn(),
			},
		});

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized', error: 'jwt expired' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('05. should throw an error if the token expired and the refresh-header token is invalid.', async () => {
		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId } });
		const refreshToken = await createAuthToken({ expiresIn: '20ms' }, { user: { id: userId } });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const authHeaderName = 'authorization';
		const refreshTokenHeaderName = 'refresh-token';

		mockRequest.headers = {
			[authHeaderName]: `Bearer ${token}`,
			[refreshTokenHeaderName]: refreshToken,
		};

		configure({
			middlewareConfigs: {
				authHeaderName,
				refreshTokenHeaderName,
				tokenGenerationHandler: jest.fn(),
			},
		});

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized', error: 'jwt expired' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('06. should throw an error if the token expired and the refresh-cookie token is invalid.', async () => {
		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId } });
		const refreshToken = await createAuthToken({ expiresIn: '20ms' }, { user: { id: userId } });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const authHeaderName = 'authorization';
		const refreshTokenCookieName = 'refresh-token';

		mockRequest.headers = {
			[authHeaderName]: `Bearer ${token}`,
		};
		mockRequest.cookies = {
			[refreshTokenCookieName]: refreshToken,
		};

		configure({
			middlewareConfigs: {
				authHeaderName,
				refreshTokenHeaderName: undefined,
				tokenGenerationHandler: jest.fn(),
			},
			cookieSettings: {
				refreshTokenCookieName,
			},
		});

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized', error: 'jwt expired' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('07. should generate a new token if the token expired and the refresh-header token is valid.', async () => {
		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId }, version: 'v1' });
		const refreshToken = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId } });

		const newToken = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId }, version: 'v2' });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const authHeaderName = 'authorization';
		const refreshTokenHeaderName = 'refresh-token';

		mockRequest.headers = {
			[authHeaderName]: `Bearer ${token}`,
			[refreshTokenHeaderName]: refreshToken,
		};

		const tokenGenerationOutput = {
			token: newToken,
			refreshToken: 'new-refresh-token',
		};

		const tokenStorage = new DefaultTokenStorage();
		tokenStorage.saveOrUpdateToken(userId, refreshToken);

		configure({
			tokenStorage,
			middlewareConfigs: {
				authHeaderName,
				refreshTokenHeaderName,
				tokenGenerationHandler: jest.fn().mockResolvedValue(tokenGenerationOutput),
			},
			cookieSettings: {
				refreshTokenCookieName: undefined,
			},
		});

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(mockResponse.setHeader).toHaveBeenCalledWith(authHeaderName, tokenGenerationOutput.token);
		expect(mockResponse.setHeader).toHaveBeenCalledWith(refreshTokenHeaderName, tokenGenerationOutput.refreshToken);
	});

	it('08. should generate a new token if the token expired and the refresh-token token is valid.', async () => {
		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId }, version: 'v1' });
		const refreshToken = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId } });

		const newToken = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId }, version: 'v2' });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const authHeaderName = 'authorization';
		const refreshTokenCookieName = 'refresh-token';
		const refreshCookieOptions = {};

		mockRequest.headers = {
			[authHeaderName]: `Bearer ${token}`,
		};

		mockRequest.cookies = {
			[refreshTokenCookieName]: refreshToken,
		};

		const tokenGenerationOutput = {
			token: newToken,
			refreshToken: 'new-refresh-token',
		};

		const tokenStorage = new DefaultTokenStorage();
		tokenStorage.saveOrUpdateToken(userId, refreshToken);

		configure({
			tokenStorage,
			middlewareConfigs: {
				authHeaderName,
				refreshTokenHeaderName: undefined,
				tokenGenerationHandler: jest.fn().mockResolvedValue(tokenGenerationOutput),
			},
			cookieSettings: {
				refreshTokenCookieName,
				refreshCookieOptions,
			},
		});

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(mockResponse.setHeader).toHaveBeenCalledWith(authHeaderName, tokenGenerationOutput.token);
		expect(mockResponse.cookie).toHaveBeenCalledWith(
			refreshTokenCookieName,
			tokenGenerationOutput.refreshToken,
			refreshCookieOptions,
		);
	});

	it('09. should update the request object with append-to-request values.', async () => {
		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId }, version: 'v1' });
		const refreshToken = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId } });

		const newToken = await createAuthToken(
			{ expiresIn: '1m' },
			{ user: { id: userId }, role: 'TestUser', version: 'v2' },
		);

		await new Promise((resolve) => setTimeout(resolve, 100));

		const authHeaderName = 'authorization';
		const refreshTokenCookieName = 'refresh-token';
		const refreshCookieOptions = {};

		mockRequest.headers = {
			[authHeaderName]: `Bearer ${token}`,
		};

		mockRequest.cookies = {
			[refreshTokenCookieName]: refreshToken,
		};

		const tokenGenerationOutput = {
			token: newToken,
			refreshToken: 'new-refresh-token',
		};

		const tokenStorage = new DefaultTokenStorage();
		tokenStorage.saveOrUpdateToken(userId, refreshToken);

		configure({
			tokenStorage,
			middlewareConfigs: {
				authHeaderName,
				refreshTokenHeaderName: undefined,
				tokenGenerationHandler: jest.fn().mockResolvedValue(tokenGenerationOutput),
				appendToRequest: ['user', 'role'],
			},
			cookieSettings: {
				refreshTokenCookieName,
				refreshCookieOptions,
			},
		});

		await validateJwtHeaderMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(mockRequest.user).toEqual({ id: userId });
		expect(mockRequest.role).toEqual('TestUser');
	});
});
