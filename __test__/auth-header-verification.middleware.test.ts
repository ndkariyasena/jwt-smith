import { NextFunction, Response } from 'express';
import validateJwtHeaderMiddleware from '../src/middleware/auth-header-verification.middleware';
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

describe('Auth Header Verification Middleware.', () => {
	let mockRequest: Partial<AuthedRequest>;
	let mockResponse: Partial<Response>;
	let mockNext: jest.Mock<NextFunction>;

	beforeEach(() => {
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
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
		const token = await createAuthToken({ expiresIn: '1s' }, { user: { id: userId } });

		await new Promise((resolve) => setTimeout(resolve, 1000));

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
});
