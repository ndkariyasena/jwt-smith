import { sign } from '../src/lib/signing-token';
import { verify } from '../src/lib/verify-token';
// import { JsonWebTokenError } from "../src/lib/core.d";

import { JsonWebTokenError } from 'jsonwebtoken';

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
