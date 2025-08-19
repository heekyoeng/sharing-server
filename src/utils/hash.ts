// src/utils/hash.ts
import bcrypt from 'bcrypt';
const ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
export const hashPassword = (plain: string) => bcrypt.hash(plain, ROUNDS);
