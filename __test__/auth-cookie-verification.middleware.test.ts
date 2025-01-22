import { NextFunction, Response } from 'express';
import validateJwtCookieMiddleware from '../src/middleware/auth-cookie-verification.middleware';
import DefaultTokenStorage from '../src/module/token-storage';
import { AuthedRequest } from '../src/lib/custom';
import { JwtManager } from '../src/lib/core';
import { sign } from '../src/lib/signing-token';

jest.mock('../src/lib/logger');

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

describe('> Auth Cookie Verification Middleware.', () => {
	let mockRequest: Partial<AuthedRequest>;
	let mockResponse: Partial<Response>;
	let mockNext: jest.Mock<NextFunction>;
	let authTokenPayloadVerifier: jest.Mock;
	let refreshTokenPayloadVerifier: jest.Mock;
	let refreshTokenHolderVerifier: jest.Mock;

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

		authTokenPayloadVerifier = jest.fn();
		refreshTokenPayloadVerifier = jest.fn();
		refreshTokenHolderVerifier = jest.fn();

		JwtManager({
			publicKey: Secret,
			middlewareConfigs: {
				tokenGenerationHandler: jest.fn(),
				authTokenPayloadVerifier,
				refreshTokenPayloadVerifier,
				refreshTokenHolderVerifier,
			},
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();

		JwtManager({
			middlewareConfigs: {
				tokenGenerationHandler: jest.fn(),
				cookieSettings: {
					accessTokenCookieName: undefined,
					refreshTokenCookieName: undefined,
				},
			},
		});
	});

	it('01. Should throw an error if the auth cookie is not found.', async () => {
		await validateJwtCookieMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: 'Unauthorized',
			error: 'Auth cookie not found!',
		});
	});

	it('02. Should throw an error if the auth cookie is invalid and the refresh token is not found.', async () => {
		const accessTokenCookieName = 'auth-token';

		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId } });

		await new Promise((resolve) => setTimeout(resolve, 100));

		mockRequest.cookies = {
			[accessTokenCookieName]: token,
		};

		JwtManager({
			middlewareConfigs: {
				tokenGenerationHandler: jest.fn(),
				cookieSettings: {
					accessTokenCookieName,
				},
				authTokenPayloadVerifier,
				refreshTokenPayloadVerifier,
				refreshTokenHolderVerifier,
			},
		});

		await validateJwtCookieMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized', error: 'jwt expired' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('03. Should throw an error if the auth cookie is invalid and the refresh cookie is invalid.', async () => {
		const accessTokenCookieName = 'auth-token';
		const refreshTokenCookieName = 'refresh-token';

		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId } });
		const refreshToken = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId } });

		await new Promise((resolve) => setTimeout(resolve, 100));

		mockRequest.cookies = {
			[accessTokenCookieName]: token,
			[refreshTokenCookieName]: refreshToken,
		};

		JwtManager({
			middlewareConfigs: {
				tokenGenerationHandler: jest.fn(),
				cookieSettings: {
					accessTokenCookieName,
					refreshTokenCookieName,
				},
				authTokenPayloadVerifier,
				refreshTokenPayloadVerifier,
				refreshTokenHolderVerifier,
			},
		});

		await validateJwtCookieMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Unauthorized', error: 'jwt expired' });
		expect(mockNext).not.toHaveBeenCalled();
	});

	it('04. Should generate a new token if the auth cookie expired and the refresh-cookie is valid.', async () => {
		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId }, version: 'v1' });
		const refreshToken = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId } });

		const newToken = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId }, version: 'v2' });

		await new Promise((resolve) => setTimeout(resolve, 100));

		const accessTokenCookieName = 'auth-token';
		const refreshTokenCookieName = 'refresh-token';
		const refreshCookieOptions = {};

		mockRequest.cookies = {
			[accessTokenCookieName]: token,
			[refreshTokenCookieName]: refreshToken,
		};

		const tokenGenerationOutput = {
			token: newToken,
			refreshToken: 'new-refresh-token',
		};

		const tokenStorage = new DefaultTokenStorage();
		tokenStorage.saveOrUpdateToken(userId, refreshToken);

		JwtManager({
			tokenStorage,
			middlewareConfigs: {
				tokenGenerationHandler: jest.fn().mockResolvedValue(tokenGenerationOutput),
				cookieSettings: {
					accessTokenCookieName,
					refreshTokenCookieName,
					refreshCookieOptions,
				},
				authTokenPayloadVerifier,
				refreshTokenPayloadVerifier,
				refreshTokenHolderVerifier: jest.fn().mockResolvedValue(true),
			},
		});

		await validateJwtCookieMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(mockResponse.cookie).toHaveBeenCalledWith(
			accessTokenCookieName,
			tokenGenerationOutput.token,
			refreshCookieOptions,
		);
		expect(mockResponse.cookie).toHaveBeenCalledWith(
			refreshTokenCookieName,
			tokenGenerationOutput.refreshToken,
			refreshCookieOptions,
		);
	});

	it('05. Should update the request object with append-to-request values.', async () => {
		const token = await createAuthToken({ expiresIn: '10ms' }, { user: { id: userId }, version: 'v1' });
		const refreshToken = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId } });

		const newToken = await createAuthToken(
			{ expiresIn: '1m' },
			{ user: { id: userId }, role: 'TestUser', version: 'v2' },
		);

		await new Promise((resolve) => setTimeout(resolve, 100));

		const accessTokenCookieName = 'auth-token';
		const refreshTokenCookieName = 'refresh-token';
		const refreshCookieOptions = {};

		mockRequest.cookies = {
			[accessTokenCookieName]: token,
			[refreshTokenCookieName]: refreshToken,
		};

		const tokenGenerationOutput = {
			token: newToken,
			refreshToken: 'new-refresh-token',
		};

		const tokenStorage = new DefaultTokenStorage();
		tokenStorage.saveOrUpdateToken(userId, refreshToken);

		JwtManager({
			tokenStorage,
			middlewareConfigs: {
				tokenGenerationHandler: jest.fn().mockResolvedValue(tokenGenerationOutput),
				appendToRequest: ['user', 'role'],
				cookieSettings: {
					accessTokenCookieName,
					refreshTokenCookieName,
					refreshCookieOptions,
				},
				authTokenPayloadVerifier,
				refreshTokenPayloadVerifier,
				refreshTokenHolderVerifier: jest.fn().mockResolvedValue(true),
			},
		});

		await validateJwtCookieMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(mockRequest.user).toEqual({ id: userId });
		expect(mockRequest.role).toEqual('TestUser');
	});

	it('06. Should proceed to next middleware if the auth cookie is valid.', async () => {
		const token = await createAuthToken({ expiresIn: '1m' }, { user: { id: userId } });

		const accessTokenCookieName = 'auth-token';

		mockRequest.cookies = {
			[accessTokenCookieName]: token,
		};

		JwtManager({
			middlewareConfigs: {
				tokenGenerationHandler: jest.fn(),
				cookieSettings: {
					accessTokenCookieName,
				},
				authTokenPayloadVerifier,
				refreshTokenPayloadVerifier,
				refreshTokenHolderVerifier,
			},
		});

		await validateJwtCookieMiddleware(mockRequest as AuthedRequest, mockResponse as Response, mockNext);

		expect(mockNext).toHaveBeenCalled();
		expect(mockResponse.status).not.toHaveBeenCalled();
		expect(mockResponse.json).not.toHaveBeenCalled();
	});
});
