import { JsonWebTokenError } from 'jsonwebtoken';
import DefaultTokenStorage from '../src/module/token-storage';
import { TokenHandler } from '../src/module/refresh-token-handler';
import { log } from '../src/lib/logger';
import { sign } from '../src/lib/signing-token';
import { configure } from '../src/index';
import * as utils from '../src/helper/utils';

jest.mock('../src/module/token-storage');

jest.mock('../src/lib/logger', () => ({
	log: jest.fn(),
}));

const Secret = 'SupperPass123';

const createAuthToken = async (options = {}, payload = {}): Promise<string> => {
	const token = (await sign({
		payload,
		secret: Secret,
		options,
	})) as unknown as string;

	return token;
};

describe('> Refresh Token Handler', () => {
	beforeAll(() => {
		configure({
			publicKey: Secret,
		});
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('>> Refresh token handler instance related tests.', () => {
		it('01. Log method should be called with a warning message when the default token storage is used.', async () => {
			new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			expect(log).toHaveBeenCalled();
			expect(log).toHaveBeenCalledTimes(1);
			expect(log).toHaveBeenCalledWith(
				'warn',
				'[TokenHandler]: Using default in-memory token storage. This is not recommended for production.',
			);
		});

		it('02. Default token storage should use when the token-storage method not provided.', async () => {
			new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			expect(DefaultTokenStorage).toHaveBeenCalled();
		});
	});

	describe('>> "validateAuthToken" method related tests.', () => {
		it('01. Should return the decoded token when the token is valid.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const subject = 'test-subject';

			const token = await createAuthToken({
				issuer: iss,
				audience: aud,
				subject,
			});

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			const decoded = (await tokenHandler.validateAuthToken(token)) as unknown as Record<string, unknown>;

			expect(decoded).not.toBeNull();
			expect(decoded?.iss).toBe(iss);
			expect(decoded?.aud).toBe(aud);
			expect(decoded?.sub).toBe(subject);
		});

		it('02. Should throw an error when the token is invalid.', async () => {
			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			const token = 'invalid-token';

			await tokenHandler.validateAuthToken(token).catch((error) => {
				expect(error).not.toBeNull();
				expect(error instanceof JsonWebTokenError).toBe(true);
			});
		});

		it('03. Should use the default auth token payload verifier when the custom verifier is not provided.', async () => {
			jest.spyOn(utils, 'defaultAuthTokenPayloadVerifier');

			const token = await createAuthToken();

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			await tokenHandler.validateAuthToken(token);

			expect(utils.defaultAuthTokenPayloadVerifier).toHaveBeenCalled();
		});

		it('04. Should use the custom auth token payload verifier when the custom verifier is provided.', async () => {
			const customAuthTokenPayloadVerifier = jest.fn();

			const token = await createAuthToken();

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
				authTokenPayloadVerifier: customAuthTokenPayloadVerifier,
			});

			await tokenHandler.validateAuthToken(token);

			expect(customAuthTokenPayloadVerifier).toHaveBeenCalled();
		});
	});

	describe('>> "rotateRefreshToken" method related tests.', () => {
		it('01. Should fall back into the default methods if the validation methods are not provided.', async () => {
			const userId = '1234';

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			const refreshToken = await createAuthToken(undefined, { user: { id: userId, name: 'tester' } });

			jest.spyOn(utils, 'defaultRefreshTokenPayloadVerifier');
			jest.spyOn(utils, 'defaultRefreshTokenHolderVerifier').mockImplementation(async () => true);
			jest
				.spyOn(DefaultTokenStorage.prototype, 'getRefreshTokenHolder')
				.mockImplementation(async () => ({ id: userId }));

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn().mockResolvedValueOnce(finalResult),
			});

			await tokenHandler.rotateRefreshToken(refreshToken);

			expect(utils.defaultRefreshTokenPayloadVerifier).toHaveBeenCalled();
			expect(utils.defaultRefreshTokenHolderVerifier).toHaveBeenCalled();
		});

		it('02. Should check the refresh token in the blacklist.', async () => {
			jest.spyOn(DefaultTokenStorage.prototype, 'checkBlackListedRefreshToken');

			const token = await createAuthToken();

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			await tokenHandler.rotateRefreshToken(token).catch((error) => error);

			expect(DefaultTokenStorage.prototype.checkBlackListedRefreshToken).toHaveBeenCalled();
		});

		it('03. Should throw an error when the refresh token is blacklisted.', async () => {
			const userId = '1234';

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			const blacklistedToken = await createAuthToken(undefined, { user: { id: userId } });
			const refreshToken = await createAuthToken(undefined, { user: { id: userId, name: 'tester' } });

			jest.spyOn(DefaultTokenStorage.prototype, 'checkBlackListedRefreshToken').mockImplementation(async (token) => {
				return token === blacklistedToken ? { id: userId } : undefined;
			});
			jest
				.spyOn(DefaultTokenStorage.prototype, 'getRefreshTokenHolder')
				.mockImplementation(async () => ({ id: userId }));

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn().mockResolvedValueOnce(finalResult),
			});

			const error = await tokenHandler.rotateRefreshToken(blacklistedToken).catch((error) => error);
			const output = await tokenHandler.rotateRefreshToken(refreshToken);

			expect(log).toHaveBeenCalled();
			expect(error instanceof Error).toBe(true);
			expect(output instanceof Error).toBe(false);
			expect(output).toEqual(finalResult);
		});

		it('04. Should throw an error when the refresh token payload verification failed.', async () => {
			const userId = '1234';

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			const blacklistedToken = await createAuthToken(undefined, { user: { id: userId } });
			const refreshToken = await createAuthToken(undefined, { user: { id: userId, name: 'tester' } });

			jest
				.spyOn(DefaultTokenStorage.prototype, 'checkBlackListedRefreshToken')
				.mockImplementation(async () => undefined);
			jest
				.spyOn(DefaultTokenStorage.prototype, 'getRefreshTokenHolder')
				.mockImplementation(async () => ({ id: userId }));

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn().mockResolvedValueOnce(finalResult),
				refreshTokenPayloadVerifier: jest.fn().mockImplementation(async (payload) => {
					if (!payload.user.name) {
						throw new Error('Role not found in the payload.');
					}
				}),
			});

			const error = await tokenHandler.rotateRefreshToken(blacklistedToken).catch((error) => error);
			const output = await tokenHandler.rotateRefreshToken(refreshToken);

			expect(log).toHaveBeenCalled();
			expect(error instanceof Error).toBe(true);
			expect(output instanceof Error).toBe(false);
			expect(output).toEqual(finalResult);
		});

		it('05. Should throw an error when can not find the refresh token holder.', async () => {
			const userId = '1234';

			jest.spyOn(DefaultTokenStorage.prototype, 'blackListRefreshToken');

			jest
				.spyOn(DefaultTokenStorage.prototype, 'checkBlackListedRefreshToken')
				.mockImplementation(async () => undefined);

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			const blacklistedToken = await createAuthToken(undefined, { user: { id: userId } });
			const refreshToken = await createAuthToken(undefined, { user: { id: userId, name: 'tester' } });

			jest
				.spyOn(DefaultTokenStorage.prototype, 'getRefreshTokenHolder')
				.mockImplementation(async (token) => (token === refreshToken ? { id: userId } : null));

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn().mockResolvedValueOnce(finalResult),
			});

			const error = await tokenHandler.rotateRefreshToken(blacklistedToken).catch((error) => error);
			const output = await tokenHandler.rotateRefreshToken(refreshToken);

			expect(log).toHaveBeenCalled();
			expect(error instanceof Error).toBe(true);
			expect(output instanceof Error).toBe(false);
			expect(output).toEqual(finalResult);
		});

		it('06. Should throw an error when the refresh token holder verification failed.', async () => {
			const userId = '1234';

			jest.spyOn(DefaultTokenStorage.prototype, 'blackListRefreshToken');

			jest
				.spyOn(DefaultTokenStorage.prototype, 'checkBlackListedRefreshToken')
				.mockImplementation(async () => undefined);
			jest
				.spyOn(DefaultTokenStorage.prototype, 'getRefreshTokenHolder')
				.mockImplementation(async () => ({ id: userId }));

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			const blacklistedToken = await createAuthToken(undefined, { user: { id: userId } });
			const refreshToken = await createAuthToken(undefined, { user: { id: userId, name: 'tester' } });

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn().mockResolvedValueOnce(finalResult),
				refreshTokenHolderVerifier: jest.fn().mockImplementation(async (_, payload) => {
					return payload.user.name === 'tester';
				}),
			});

			const error = await tokenHandler.rotateRefreshToken(blacklistedToken).catch((error) => error);
			const output = await tokenHandler.rotateRefreshToken(refreshToken);

			expect(log).toHaveBeenCalled();
			expect(error instanceof Error).toBe(true);
			expect(output instanceof Error).toBe(false);
			expect(output).toEqual(finalResult);
			expect(DefaultTokenStorage.prototype.blackListRefreshToken).toHaveBeenCalled();
		});

		it('07. Should return the new token and refresh token when the refresh token rotation is successful.', async () => {
			const userId = '1234';

			jest
				.spyOn(DefaultTokenStorage.prototype, 'checkBlackListedRefreshToken')
				.mockImplementation(async () => undefined);
			jest
				.spyOn(DefaultTokenStorage.prototype, 'getRefreshTokenHolder')
				.mockImplementation(async () => ({ id: userId }));

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			const refreshToken = await createAuthToken(undefined, { user: { id: userId } });

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn().mockResolvedValueOnce(finalResult),
			});

			const output = await tokenHandler.rotateRefreshToken(refreshToken);

			expect(output instanceof Error).toBe(false);
			expect(output).toEqual(finalResult);
		});
	});

	describe('>> "validateOrRefreshAuthToken" method related tests.', () => {
		it('01. Should return the decoded token when the token is valid.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const subject = 'test-subject';

			const token = await createAuthToken({
				issuer: iss,
				audience: aud,
				subject,
			});
			const refreshToken = 'dummy-refresh-token';

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			const result = await tokenHandler.validateOrRefreshAuthToken(token, refreshToken);

			expect(result.nextRefreshToken).toBeTruthy();
			expect(result.nextRefreshToken).toBe(refreshToken);

			expect(result.token).toBeTruthy();
			expect(result.token).toBe(token);

			expect(result.decodedToken).toBeTruthy();
			expect(result.decodedToken?.iss).toBe(iss);
			expect(result.decodedToken?.aud).toBe(aud);
			expect(result.decodedToken?.sub).toBe(subject);
		});

		it('02. Should return the decoded token when the token is valid and refresh token is not provided.', async () => {
			const token = await createAuthToken({
				expiresIn: '1s',
			});

			await new Promise((resolve) => setTimeout(resolve, 1000));

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			const result = await tokenHandler.validateOrRefreshAuthToken(token, undefined).catch((error) => error);

			expect(result).toBeTruthy();
			expect(result instanceof Error).toBe(true);
		});

		it('03. Should create a new token and refresh token if the token is expired and refresh token is available.', async () => {
			const userId = '1234';

			const token = await createAuthToken(
				{
					expiresIn: '1s',
				},
				{ user: { id: userId } },
			);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			jest
				.spyOn(DefaultTokenStorage.prototype, 'checkBlackListedRefreshToken')
				.mockImplementation(async () => undefined);
			jest
				.spyOn(DefaultTokenStorage.prototype, 'getRefreshTokenHolder')
				.mockImplementation(async () => ({ id: userId }));

			const newToken = await createAuthToken(undefined, { user: { id: userId } });

			const refreshToken = await createAuthToken(undefined, { user: { id: userId }, version: 1 });
			const newRefreshToken = await createAuthToken(undefined, { user: { id: userId }, version: 2 });

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn().mockResolvedValueOnce({
					token: newToken,
					refreshToken: newRefreshToken,
				}),
			});

			const result = await tokenHandler.validateOrRefreshAuthToken(token, refreshToken).catch((error) => error);

			expect(result).not.toBeNull();

			expect(result.nextRefreshToken).toBeTruthy();
			expect(typeof result.nextRefreshToken).toBe('string');
			expect(result.nextRefreshToken).not.toBe(refreshToken);

			expect(result.token).toBeTruthy();
			expect(result.token).not.toBe(token);

			expect(result.decodedToken).toBeTruthy();
		});
	});
});
