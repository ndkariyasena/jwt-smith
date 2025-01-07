import DefaultTokenStorage from '../src/module/token-storage';
import { TokenHandler } from '../src/module/refresh-token-handler';
import { log } from '../src/lib/logger';
import { sign } from '../src/lib/signing-token';
import { configure } from '../src/index';
import { JsonWebTokenError } from 'jsonwebtoken';
import * as utils from '../src/helper/utils';

jest.mock('../src/module/token-storage');

jest.mock('../src/lib/logger', () => ({
	log: jest.fn(),
}));

const createAuthToken = async (secret: string, options = {}, payload = {}): Promise<string> => {
	const token = (await sign({
		payload,
		secret,
		options,
	})) as unknown as string;

	return token;
};

describe('Refresh Token Handler', () => {
	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('Refresh token handler instance related tests.', () => {
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

	describe('"validateAuthToken" method related tests.', () => {
		it('01. Should return the decoded token when the token is valid.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const subject = 'test-subject';

			const secret = 'SupperPass123';

			configure({
				publicKey: secret,
			});

			const token = await createAuthToken(secret, {
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
			const secret = 'SupperPass123';

			configure({
				publicKey: secret,
			});

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

			const secret = 'SupperPass123';

			configure({
				publicKey: secret,
			});

			const token = await createAuthToken(secret);

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			await tokenHandler.validateAuthToken(token);

			expect(utils.defaultAuthTokenPayloadVerifier).toHaveBeenCalled();
		});

		it('04. Should use the custom auth token payload verifier when the custom verifier is provided.', async () => {
			const customAuthTokenPayloadVerifier = jest.fn();

			const secret = 'SupperPass123';

			configure({
				publicKey: secret,
			});

			const token = await createAuthToken(secret);

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
				authTokenPayloadVerifier: customAuthTokenPayloadVerifier,
			});

			await tokenHandler.validateAuthToken(token);

			expect(customAuthTokenPayloadVerifier).toHaveBeenCalled();
		});
	});

	describe('"rotateRefreshToken" method related tests', () => {
		it('01. Should fall back into the default methods if the validation methods are not provided.', async () => {
			const secret = 'SupperPass123';
			const userId = '1234';

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			configure({
				publicKey: secret,
			});

			const refreshToken = await createAuthToken(secret, undefined, { user: { id: userId, name: 'tester' } });

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

			const secret = 'SupperPass123';

			configure({
				publicKey: secret,
			});

			const token = await createAuthToken(secret);

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			await tokenHandler.rotateRefreshToken(token).catch((error) => error);

			expect(DefaultTokenStorage.prototype.checkBlackListedRefreshToken).toHaveBeenCalled();
		});

		it('03. Should throw an error when the refresh token is blacklisted.', async () => {
			const secret = 'SupperPass123';
			const userId = '1234';

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			configure({
				publicKey: secret,
			});

			const blacklistedToken = await createAuthToken(secret, undefined, { user: { id: userId } });
			const refreshToken = await createAuthToken(secret, undefined, { user: { id: userId, name: 'tester' } });

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
			const secret = 'SupperPass123';
			const userId = '1234';

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			configure({
				publicKey: secret,
			});

			const blacklistedToken = await createAuthToken(secret, undefined, { user: { id: userId } });
			const refreshToken = await createAuthToken(secret, undefined, { user: { id: userId, name: 'tester' } });

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
			const secret = 'SupperPass123';
			const userId = '1234';

			jest.spyOn(DefaultTokenStorage.prototype, 'blackListRefreshToken');

			jest
				.spyOn(DefaultTokenStorage.prototype, 'checkBlackListedRefreshToken')
				.mockImplementation(async () => undefined);

			const finalResult = {
				refreshToken: 'new-refresh-token',
				token: 'new-token',
			};

			configure({
				publicKey: secret,
			});

			const blacklistedToken = await createAuthToken(secret, undefined, { user: { id: userId } });
			const refreshToken = await createAuthToken(secret, undefined, { user: { id: userId, name: 'tester' } });

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
			const secret = 'SupperPass123';
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

			configure({
				publicKey: secret,
			});

			const blacklistedToken = await createAuthToken(secret, undefined, { user: { id: userId } });
			const refreshToken = await createAuthToken(secret, undefined, { user: { id: userId, name: 'tester' } });

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
			const secret = 'SupperPass123';
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

			configure({
				publicKey: secret,
			});

			const refreshToken = await createAuthToken(secret, undefined, { user: { id: userId } });

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn().mockResolvedValueOnce(finalResult),
			});

			const output = await tokenHandler.rotateRefreshToken(refreshToken);

			expect(output instanceof Error).toBe(false);
			expect(output).toEqual(finalResult);
		});
	});
});
