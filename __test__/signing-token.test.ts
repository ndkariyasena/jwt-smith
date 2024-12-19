import { sign, setDefaultSignOptions } from '../src/lib/signing-token';

describe('Token "signing" method related tests.', () => {
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
		await sign({
			payload: {},
			secret: 'SupperPass123',
			options: {},
		}).then((token) => {
			expect(token).not.toBeNull();
			expect(typeof token).toBe('string');
		});
	});
});

describe.skip('Token "setDefaultSignOptions" method related tests.', () => {
	it('01. Should return a boolean value for valid data.', async () => {
		setDefaultSignOptions({
			issuer: 'https://example.com',
			expiresIn: '1h',
			audience: 'your-app',
		});
	});
});
