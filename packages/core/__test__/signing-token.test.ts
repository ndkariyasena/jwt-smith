import { sign } from "../src/module/signing-token";

describe('Token "signing" method related tests.', () => {
  it('01. Should throw an error for invalid secret value.', async () => {
    try {
      const token = await sign({
        payload: {},
        secret: '1234567890',
      })

      console.info({token})
    } catch (error) {
      console.error(error)
    }
  })
})