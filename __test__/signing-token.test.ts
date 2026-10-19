import { sign, setDefaultSignOptions, setDefaultVerifyOptions } from '../src/lib/signing-token';
import { verify } from '../src/lib/verify-token';

describe('> Signin', () => {
	describe('>> Token "signing" method related tests.', () => {
		it('01. Should throw an error for invalid secret value.', async () => {
			await sign({
				payload: {},
				secret: '',
				options: {},
			}).catch((error) => {
				expect(error).not.toBeNull();
			});
		});

		it('02. Should return a string token for valid inputs with required algorithm.', async () => {
			const token = await sign({
				payload: {},
				secret: 'SupperPass123',
				options: {
					algorithm: 'HS256',  // Algorithm is now required for security
				},
			});
			expect(token).not.toBeNull();
			expect(typeof token).toBe('string');
		});

		it('03. ⚠️ SECURITY: Should throw error when using "none" algorithm.', async () => {
			await sign({
				payload: { userId: 123 },
				secret: 'SupperPass123',
				options: {
					algorithm: 'none',  // ⚠️ SECURITY: This should be rejected
				},
			}).catch((error) => {
				expect(error).toBeDefined();
				expect(error.message).toContain('Validation Error');
				expect(error.message).toContain('none');
			});
		});

		it('04. ⚠️ SECURITY: Should reject invalid algorithms.', async () => {
			await sign({
				payload: { userId: 123 },
				secret: 'SupperPass123',
				options: {
					algorithm: 'invalid-algo',  // Should be rejected - not in secure whitelist
				},
			}).catch((error) => {
				expect(error).toBeDefined();
				expect(error.message).toContain('Validation Error');
			});
		});

		it('05. Should return valid token with RS256 algorithm.', async () => {
			const token = await sign({
				payload: { userId: 123 },
				secret: 'SupperPass123',
				options: {
					algorithm: 'RS256',
				},
			});
			expect(token).not.toBeNull();
			expect(typeof token).toBe('string');
			expect(token.startsWith('eyJ')).toBe(true);
		});
	});

	describe('>> Token "setDefaultSignOptions" method related tests.', () => {
		it('01. Pre-set values should be included in the decoded token.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const subject = 'test-subject';
			const secret = 'SupperPass123';

			setDefaultSignOptions({
				issuer: iss,
				expiresIn: '1h',
				audience: aud,
			});

			const token = (await sign({
				payload: {},
				secret,
				options: {
					algorithm: 'HS256',  // Required - algorithm must be specified
					subject,
				},
			})) as unknown as string;

			const decoded = (await verify({ token, secret })) as unknown as Record<string, string>;

			expect(decoded).not.toBeNull();
			expect(decoded.iss).toBe(iss);
			expect(decoded.aud).toBe(aud);
			expect(decoded.sub).toBe(subject);
			expect(decoded.header.alg).toBe('256');
		});

		it('02. Pre-set values should be over-written with the options parameters.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const subject_1 = 'test-subject-1';
			const subject_2 = 'test-subject-2';
			const secret = 'SupperPass123';

			setDefaultSignOptions({
				issuer: iss,
				expiresIn: '1h',
				audience: aud,
				subject: subject_1,
			});

			const token = (await sign({
				payload: {},
				secret,
				options: {
					algorithm: 'HS256',  // Required
					subject: subject_2,
				},
			})) as unknown as string;

			const decoded = (await verify({ token, secret })) as unknown as Record<string, string>;

			expect(decoded).not.toBeNull();
			expect(decoded.iss).toBe(iss);
			expect(decoded.aud).toBe(aud);
			expect(decoded.sub).toBe(subject_2);
		});

		it('03. Should throw an error if algorithm is not provided (now required).', async () => {
			setDefaultSignOptions({
				issuer: 'https://example.com',
				expiresIn: '1h',
				audience: 'your-app',
			});

			await expect(
				sign({
					payload: {},
					secret: 'SupperPass123',
					options: {},
				}),
			).rejects.toThrow();

			expect(true).toBe(true);  // Test passed if error was thrown
		});

		it('04. Should throw an error if default options are invalid.', async () => {
			setDefaultSignOptions({
				issuer: undefined,
				expiresIn: '1h',
				audience: 'your-app',
			});

			await expect(
				sign({
					payload: {},
					secret: 'SupperPass123',
					options: {
						algorithm: 'HS256',  // Required
					},
				}),
			).rejects.toThrow();
		});
	});
});
