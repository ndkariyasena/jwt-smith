import { sign } from '../src/lib/signing-token';

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
