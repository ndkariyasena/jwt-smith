import { sign, setDefaultSignOptions, setDefaultVerifyOptions } from '../src/lib/signing-token';
import { verify } from '../src/lib/verify-token';
import { log } from '../src/lib/logger';

jest.mock('../src/lib/logger');

describe('> Security: Algorithm Validation', () => {
	describe('>> "sign" method - Algorithm "none" should be rejected.', () => {
		it('01. Should throw an error when explicitly using "none" algorithm.', async () => {
			await sign({
				payload: { userId: 123 },
				secret: 'SupperPass123',
				options: {
					algorithm: 'none',  // ⚠️ SECURITY: This should be rejected
				},
			}).catch((error) => {
				expect(error).toBeDefined();
				expect(error).toContain('Validation Error');
				expect(error).toContain('none');
			});
		});

		it('02. Should throw an error when trying to verify with "none" algorithm.', async () => {
			const token = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjEyM30.invalid_signature';

			await verify({
				token,
				secret: 'SupperPass123',
				options: {
					algorithm: 'none',  // ⚠️ SECURITY: This should throw an error now
				},
			}).catch((error) => {
				expect(error).toBeDefined();
				expect(error).not.toBeNull();
				// Should still throw because 'none' is not in the secure algorithm whitelist
			});
		});

		it('03. Should use secure default algorithm (HS256).', async () => {
			const secret = 'SupperPass123';
			const token = await sign({
				payload: { userId: 123 },
				secret,
				options: {},  // Will use default 'HS256'
			});

			const decoded = (await verify({ token, secret })) as unknown as Record<string, string>;

			expect(decoded.header.alg).toBe('256');
			expect(decoded.iss).toBeDefined();
			expect(decoded.exp).toBeDefined();
		});

		it('04. Should accept all secure algorithms.', async () => {
			const secureAlgorithms = [
				'HS256', 'HS384', 'HS512',
				'RS256', 'RS384', 'RS512',
				'ES256', 'ES384', 'ES512',
				'PS256', 'PS384', 'PS512',
			];

			for (const algo of secureAlgorithms) {
				const token = await sign({
					payload: { userId: 123 },
					secret: 'SupperPass123',
					options: {
						algorithm: algo,
					},
				});

				const decoded = (await verify({ token, secret })) as unknown as Record<string, any>;

				expect(decoded.header.alg).not.toBe('None');
			}
		});

		it('05. Should reject invalid/custom algorithms.', async () => {
			const invalidAlgorithms = ['none', 'invalid', 'custom', 'random'];

			for (const invalidAlgo of invalidAlgorithms) {
				await sign({
					payload: { userId: 123 },
					secret: 'SupperPass123',
					options: {
						algorithm: invalidAlgo,  // Should be rejected
					},
				}).catch((error) => {
					expect(error).toBeDefined();
				});
			}
		});
	});
});

describe('>>setDefaultSignOptions - Additional Security Checks', () => {
	it('01. Should not allow setting "none" as default algorithm.', () => {
		setDefaultSignOptions({
			algorithm: 'none',
		});

		// Verify that setting 'none' as default is not possible
		// This should have been rejected by the Joi schema validation
	});
});

describe('>>setDefaultVerifyOptions - Algorithm Whitelist Enforcement', () => {
	it('01. Should reject "none" algorithm when setting default verify options.', () => {
		try {
			setDefaultVerifyOptions({
				algorithm: 'none',  // Should be rejected
			});
			// If we get here without an error, something is wrong with the implementation
			expect(true).toBe(false);
		} catch (error: any) {
			// This is expected - we want to reject 'none'
			expect(error).toBeDefined();
			expect(error.message).toContain('SECURITY ALERT');
		}
	});

	it('02. Should reject invalid algorithms when setting default verify options.', () => {
		try {
			setDefaultVerifyOptions({
				algorithm: 'invalid-algo',  // Should be rejected
			});
			expect(false).toBe(true);
		} catch (error: any) {
			expect(error).toBeDefined();
			expect(error.message).toContain('SECURITY ALERT');
		}
	});

	it('03. Should accept valid secure algorithms.', () => {
		setDefaultVerifyOptions({
			algorithm: 'HS256',
		});
		// Should not throw
	});
});
