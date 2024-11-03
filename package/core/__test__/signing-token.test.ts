import { sign } from "../src/module/signing-token";

describe('Token signing method related tests.', () => {
  it('01. Should throw an error for invalid parameters', () => {
    try {
      const token = sign({
        payload: {},
        secret: '',
      })

      console.info({token})
    } catch (error) {
      console.error(error)
    }
  })
})