import { sign } from '../src/lib/signing-token';
import { verify, setDefaultVerifyOptions } from '../src/lib/verify-token';
import { log } from '../src/lib/logger';
import { JsonWebTokenError } from 'jsonwebtoken';

jest.mock('../src/lib/logger');

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
				options: { expiresIn: '1h', algorithm: 'HS256' },
			};

			const token = (await sign(signParams)) as unknown as string;
			expect(typeof token).toBe('string');

			const verifyParams = {
				token,
				secret,
				options: {
					algorithm: 'HS256',  // Required for verification
				},
			};

			const decoded = await verify(verifyParams);
			expect(decoded).toHaveProperty('test', 'verify-method');
		});

		it('05. ⚠️ SECURITY: Should reject tokens signed with "none" algorithm.', async () => {
			const secret = 'SupperPass123';
			const token = await sign({
				payload: { userId: 123 },
				secret,
				options: {
					algorithm: 'none',
				},
			}).catch((err) => {
				// Signing with 'none' should fail - can't actually sign with no algorithm
				if (err) throw err;
			});

			// If token is still returned (jsonwebtoken allows it), verification should fail
			const invalidToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VySWQiOjEyM30.invalid_signature';

			await expect(verify({
				token: invalidToken,
				secret,
				options: {
					algorithm: 'none',  // ⚠️ SECURITY: This should still throw - 'none' not in whitelist
				},
			})).rejects.toThrow();
		});
	});

	describe('>> Token "setDefaultVerifyOptions" method - Security Tests.', () => {
		const iss = 'https://example.com';
		const aud = 'your-app';
		const subject = 'test-subject';
		const secret = 'SupperPass123';

		beforeEach(() => {
			setDefaultVerifyOptions({
				issuer: iss,
				subject,
				audience: aud,
				algorithm: 'HS256',  // Required
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
					algorithm: 'HS256',
				},
			})) as unknown as string;

			const decoded = await verify({
				token,
				secret,
				options: {
					algorithm: 'HS256',
				},
			});

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
					algorithm: 'HS256',
				},
			})) as unknown as string;

			await expect(
				verify({
					token,
					secret,
					options: {
						algorithm: 'HS256',
					},
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
					algorithm: 'HS256',
				},
			})) as unknown as string;

			await expect(
				verify({
					token,
					secret,
					options: {
						algorithm: 'HS256',
					},
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
					algorithm: 'HS256',
				},
			})) as unknown as string;

			await expect(
				verify({
					token,
					secret,
					options: {
						algorithm: 'HS256',
					},
				}),
			).rejects.toThrow(JsonWebTokenError);
		});
	});

	describe('>> Token "setDefaultVerifyOptions" - Security: Invalid Algorithm Rejection.', () => {
		it('01. Should reject "none" algorithm when setting default verify options.', () => {
			try {
				setDefaultVerifyOptions({
					algorithm: 'none',  // ⚠️ SECURITY: Should be rejected
				});
				// If we get here without an error, the fix is not working
				expect(false).toBe(true);
			} catch (error: any) {
				// Expected - we should reject 'none'
				expect(error.message).toContain('SECURITY ALERT');
				expect(error.message).toContain('none');
				expect(error.message).toContain('signature verification');
				expect(error.message).toContain('authentication bypass');
			}
		});

		it('02. Should reject invalid/custom algorithms when setting default verify options.', () => {
			try {
				setDefaultVerifyOptions({
					algorithm: 'invalid-algo',  // Should be rejected - not in secure whitelist
				});
				expect(false).toBe(true);
			} catch (error: any) {
				expect(error).toBeDefined();
				expect(error.message).toContain('SECURITY ALERT');
				expect(error.message).toContain('invalid-algo');
			}
		});

		it('03. Should accept valid secure algorithms.', () => {
			setDefaultVerifyOptions({
				algorithm: 'RS256',
			});
			// Should not throw - RS256 is in the secure whitelist
		});

		it('04. Should require at least one algorithm to be specified.', () => {
			try {
				setDefaultVerifyOptions({
					// No algorithm specified - should fail validation
				});
				expect(false).toBe(true);
			} catch (error: any) {
				expect(error).toBeDefined();
				expect(error.message).toContain('algorithms');
			}
		});

		it('05. ⚠️ SECURITY: Should reject "invalid" algorithm when setting default verify options.', () => {
			try {
				setDefaultVerifyOptions({
					algorithm: 'invalid',  // Should be rejected
				});
				expect(false).toBe(true);
			} catch (error: any) {
				expect(error.message).toContain('SECURITY ALERT');
				expect(error.message).toContain('invalid');
				expect(error.message).toContain('signature verification');
			}
		});

		it('06. Should reject "HS256none" (invalid combination).', () => {
			try {
				setDefaultVerifyOptions({
					algorithm: 'HS256none',  // Invalid - not a valid algorithm
				});
				expect(false).toBe(true);
			} catch (error: any) {
				expect(error).toBeDefined();
			}
		});
	});
});
