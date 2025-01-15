import { sign, setDefaultSignOptions } from '../src/lib/signing-token';
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

		it('02. Should return a string token for valid inputs', async () => {
			const token = await sign({
				payload: {},
				secret: 'SupperPass123',
				options: {},
			});
			expect(token).not.toBeNull();
			expect(typeof token).toBe('string');
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
				options: { subject },
			})) as unknown as string;

			const decoded = (await verify({ token, secret })) as unknown as Record<string, string>;

			expect(decoded).not.toBeNull();
			expect(decoded.iss).toBe(iss);
			expect(decoded.aud).toBe(aud);
			expect(decoded.sub).toBe(subject);
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
				options: { subject: subject_2 },
			})) as unknown as string;

			const decoded = (await verify({ token, secret })) as unknown as Record<string, string>;

			expect(decoded).not.toBeNull();
			expect(decoded.iss).toBe(iss);
			expect(decoded.aud).toBe(aud);
			expect(decoded.sub).toBe(subject_2);
		});

		it('03. Should use default options if none are provided.', async () => {
			const iss = 'https://example.com';
			const aud = 'your-app';
			const secret = 'SupperPass123';

			setDefaultSignOptions({
				issuer: iss,
				expiresIn: '1h',
				audience: aud,
			});

			const token = (await sign({
				payload: {},
				secret,
				options: {},
			})) as unknown as string;

			const decoded = (await verify({ token, secret })) as unknown as Record<string, string>;

			expect(decoded).not.toBeNull();
			expect(decoded.iss).toBe(iss);
			expect(decoded.aud).toBe(aud);
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
					options: {},
				}),
			).rejects.toThrow();
		});
	});
});
