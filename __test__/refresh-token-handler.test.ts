import { TokenHandler } from '../src/module/refresh-token-handler';
import { log } from '../src/lib/logger';
import DefaultTokenStorage from '../src/module/token-storage';
import { sign } from '../src/lib/signing-token';
import { configure } from '../src/index';

jest.mock('../src/module/token-storage');
// jest.mock('../src/lib/logger', () => ({ default: { log: jest.fn() } }));
// jest.mock(log, () => ({ default: { log: jest.fn() } }));

/* const loggerMock = {
  log: jest.fn(),
}; */

jest.mock('../src/lib/logger', () => ({
	log: jest.fn(),
}));

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
		it('03. Should return the decoded token when the token is valid.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const subject = 'test-subject';

			const secret = 'SupperPass123';

			configure({
				publicKey: secret,
			});

			const token = (await sign({
				payload: {},
				secret,
				options: {
					issuer: iss,
					audience: aud,
					subject,
				},
			})) as unknown as string;

			const tokenHandler = new TokenHandler({
				// refreshTokenStorage: tokenStorage,
				tokenGenerationHandler: jest.fn(),
			});

			const decoded = (await tokenHandler.validateAuthToken(token)) as unknown as Record<string, unknown>;

			expect(decoded).not.toBeNull();
			expect(decoded?.iss).toBe(iss);
			expect(decoded?.aud).toBe(aud);
			expect(decoded?.sub).toBe(subject);
		});
	});
});
