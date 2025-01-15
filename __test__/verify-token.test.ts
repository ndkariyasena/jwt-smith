import { sign } from '../src/lib/signing-token';
import { verify, setDefaultVerifyOptions } from '../src/lib/verify-token';
import { JsonWebTokenError } from 'jsonwebtoken';

describe('> Verify', () => {
	describe('>> Token "verify" method related tests.', () => {
		it('01. Should throw an error for invalid secret value.', async () => {
			await expect(
				verify({
					token: 'qqq.2.44',
					secret: '',
				}),
			).rejects.toThrow(JsonWebTokenError);
		});

		it('02. Should throw an error for invalid token value.', async () => {
			await verify({
				token: '',
				secret: '123455',
			}).catch((error) => {
				expect(error).not.toBeNull();
			});
		});

		it('03. Should throw an error for tampered token.', async () => {
			const secret = 'SupperPass123';
			const signParams = {
				payload: { test: 'verify-method' },
				secret,
				options: { notBefore: '1d' },
			};

			const token = await sign(signParams);
			expect(typeof token).toBe('string');

			const verifyParams = {
				token: `${token}x`,
				secret,
			};

			await expect(verify(verifyParams)).rejects.toThrow(JsonWebTokenError);
		});

		it('04. Should verify a valid token successfully.', async () => {
			const secret = 'SupperPass123';
			const signParams = {
				payload: { test: 'verify-method' },
				secret,
				options: { expiresIn: '1h' },
			};

			const token = (await sign(signParams)) as unknown as string;
			expect(typeof token).toBe('string');

			const verifyParams = {
				token,
				secret,
			};

			const decoded = await verify(verifyParams);
			expect(decoded).toHaveProperty('test', 'verify-method');
		});
	});

	describe('>> Token "setDefaultVerifyOptions" method related tests.', () => {
		const iss = 'https://example.com';
		const aud = 'your-app';
		const subject = 'test-subject';
		const secret = 'SupperPass123';

		beforeEach(() => {
			setDefaultVerifyOptions({
				issuer: iss,
				subject,
				audience: aud,
			});
		});

		it('01. Verify method should pass with the correct data.', async () => {
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
				token,
				secret,
			})) as unknown as Record<string, string>;

			expect(decoded).not.toBeNull();
			expect(decoded?.iss).toBe(iss);
			expect(decoded?.aud).toBe(aud);
			expect(decoded?.sub).toBe(subject);
		});

		it('02. Verify method should throw an error with incorrect subject in the token.', async () => {
			const token = (await sign({
				payload: {},
				secret,
				options: {
					issuer: iss,
					audience: aud,
					subject: 'wrong-subject',
				},
			})) as unknown as string;

			await expect(
				verify({
					token,
					secret,
				}),
			).rejects.toThrow(JsonWebTokenError);
		});

		it('03. Verify method should throw an error with incorrect issuer in the token.', async () => {
			const token = (await sign({
				payload: {},
				secret,
				options: {
					issuer: 'wrong-issuer',
					audience: aud,
					subject,
				},
			})) as unknown as string;

			await expect(
				verify({
					token,
					secret,
				}),
			).rejects.toThrow(JsonWebTokenError);
		});

		it('04. Verify method should throw an error with incorrect audience in the token.', async () => {
			const token = (await sign({
				payload: {},
				secret,
				options: {
					issuer: iss,
					audience: 'wrong-audience',
					subject,
				},
			})) as unknown as string;

			await expect(
				verify({
					token,
					secret,
				}),
			).rejects.toThrow(JsonWebTokenError);
		});
	});
});
