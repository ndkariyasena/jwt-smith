import { sign } from '../src/lib/signing-token';
import { verify, setDefaultVerifyOptions } from '../src/lib/verify-token';

import { JsonWebTokenError } from 'jsonwebtoken';

describe('Verify', () => {
	describe('Token "verify" method related tests.', () => {
		it('01. Should throw an error for invalid secret value.', async () => {
			await verify({
				token: 'qqq.2.44',
				secret: '',
			}).catch((error) => {
				expect(error).not.toBeNull();
			});
		});

		it('02. Should throw an error for invalid secret value.', async () => {
			await verify({
				token: '',
				secret: '123455',
			}).catch((error) => {
				expect(error).not.toBeNull();
			});
		});

		it('03. Should throw an error for invalid token value.', async () => {
			const secret = 'SupperPass123';
			const signParams = {
				payload: {
					test: 'verify-method',
				},
				secret,
				options: {
					notBefore: '1d',
				},
			};

			const token = await sign(signParams);
			expect(typeof token).toBe('string');

			const verifyParams = {
				token: `${token}x`,
				secret,
			};

			await verify(verifyParams).catch((error) => {
				expect(error).not.toBeNull();
				expect(error instanceof JsonWebTokenError).toBe(true);
			});
		});
	});

	describe('Token "setDefaultVerifyOptions" method related tests.', () => {
		it('01. Verify method should pass with the correct data.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const subject = 'test-subject';

			const secret = 'SupperPass123';

			setDefaultVerifyOptions({
				issuer: iss,
				subject,
				audience: aud,
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

			const decoded = (await verify({
				token: token,
				secret,
			})) as unknown as Record<string, unknown>;

			expect(decoded).not.toBeNull();
			expect(decoded.iss).toBe(iss);
			expect(decoded.aud).toBe(aud);
		});

		it('02. Verify method should throw an error with the incorrect data in the token.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const subject = 'test-subject';

			const secret = 'SupperPass123';

			setDefaultVerifyOptions({
				issuer: iss,
				subject,
				audience: aud,
			});

			const token = (await sign({
				payload: {},
				secret,
				options: {
					issuer: iss,
					audience: aud,
					subject: 'wrong-subject',
				},
			})) as unknown as string;

			await verify({
				token: token,
				secret,
			}).catch((error) => {
				expect(error).not.toBeNull();
				expect(error instanceof JsonWebTokenError).toBe(true);
			});
		});
	});
});
