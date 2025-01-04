import { TokenHandler } from '../src/module/refresh-token-handler';
import { log } from '../src/lib/logger';
import DefaultTokenStorage from '../src/module/token-storage';
import { sign } from '../src/lib/signing-token';
import { configure } from '../src/index';
import { JsonWebTokenError } from 'jsonwebtoken';
/* import {
	defaultAuthTokenPayloadVerifier,
	// defaultRefreshTokenPayloadVerifier,
	// defaultRefreshTokenHolderVerifier,
} from '../src/helper/utils'; */
import * as utils from '../src/helper/utils';

jest.mock('../src/module/token-storage');

jest.mock('../src/lib/logger', () => ({
	log: jest.fn(),
}));

const createAuthToken = async (secret: string, options?: Record<string, unknown>): Promise<string> => {
	const token = (await sign({
		payload: {},
		secret,
		options,
	})) as unknown as string;

	return token;
};

describe('Refresh Token Handler', () => {
	describe('Refresh token handler instance related tests.', () => {
		it('01. Log method should be called with a warning message when the default token storage is used.', async () => {
			/* const tokenGenerationHandler = {
        generateAuthToken: jest.fn(),
        generateRefreshToken: jest.fn(),
      }; */

			// const tokenGenerationHandler = jest.fn().mockImplementation((refreshTokenPayload, tokenHolder) => {
			//   console.log({ refreshTokenPayload, tokenHolder });
			//   return {
			//     token: 'new-token',
			//     refreshToken: 'new-refresh-token',
			//   }
			// });

			new TokenHandler({
				// refreshTokenStorage: tokenStorage,
				tokenGenerationHandler: jest.fn(),
			});

			expect(log).toHaveBeenCalled();
			expect(log).toHaveBeenCalledTimes(1);
			expect(log).toHaveBeenCalledWith(
				'warn',
				'[TokenHandler]: Using default in-memory token storage. This is not recommended for production.',
			);
			// expect(tokenGenerationHandler).toHaveBeenCalled();
		});

		it('02. Default token storage should use when the token-storage method not provided.', async () => {
			/* const tokenGenerationHandler = {
        generateAuthToken: jest.fn(),
        generateRefreshToken: jest.fn(),
      }; */

			// const tokenGenerationHandler = jest.fn().mockImplementation((refreshTokenPayload, tokenHolder) => {
			//   console.log({ refreshTokenPayload, tokenHolder });
			//   return {
			//     token: 'new-token',
			//     refreshToken: 'new-refresh-token',
			//   }
			// });

			new TokenHandler({
				// refreshTokenStorage: tokenStorage,
				tokenGenerationHandler: jest.fn(),
			});

			expect(DefaultTokenStorage).toHaveBeenCalled();
			// expect(tokenGenerationHandler).toHaveBeenCalled();
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
		it('01. Should check the refresh token in the blacklist.', async () => {
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

		it('02. Should throw an error when the refresh token is blacklisted.', async () => {
			const secret = 'SupperPass123';

			configure({
				publicKey: secret,
			});

			const token = await createAuthToken(secret);

			const tokenStorage = new DefaultTokenStorage();
			tokenStorage.blackListRefreshToken(token);

			const tokenHandler = new TokenHandler({
				tokenGenerationHandler: jest.fn(),
			});

			const error = await tokenHandler.rotateRefreshToken(token).catch((error) => error);

			expect(log).toHaveBeenCalled();
			expect(log).toHaveBeenCalledTimes(1);
			expect(error instanceof Error).toBe(true);
		});
	});
});
