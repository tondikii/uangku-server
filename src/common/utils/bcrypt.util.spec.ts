import { hashPassword, comparePassword } from './bcrypt.util';

describe('bcrypt.util', () => {
  it('should hash and compare password correctly', async () => {
    const password = 'mySecret123';
    const hashed = await hashPassword(password);

    expect(typeof hashed).toBe('string');
    expect(hashed).not.toBe(password);

    const isMatch = await comparePassword(password, hashed);
    expect(isMatch).toBe(true);
  });

  it('should fail compare for wrong password', async () => {
    const hashed = await hashPassword('rightPass');
    const isMatch = await comparePassword('wrongPass', hashed);
    expect(isMatch).toBe(false);
  });
});
