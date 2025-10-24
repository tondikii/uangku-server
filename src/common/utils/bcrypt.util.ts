import { hash, compare } from 'bcryptjs';

export async function hashPassword(password: string): Promise<string> {
  const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS);
  return await hash(password, SALT_ROUNDS);
}

export async function comparePassword(
  plainText: string,
  hashedPassword: string,
): Promise<boolean> {
  return await compare(plainText, hashedPassword);
}
