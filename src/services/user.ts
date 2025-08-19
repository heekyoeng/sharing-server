// src/services/user.service.ts
import { isDate } from 'util/types';
import { UserModel } from '../models/User';
import { RegisterRequest, UserPublic } from '../types/auth';
import { hashPassword } from '../utils/hash';


export async function registerUserSvc(p: RegisterRequest): Promise<UserPublic> {
  const uname = p.username.trim();
  const mail  = (p.email ?? '').trim().toLowerCase();   // ✅ 안전

  const orConds = [{ username: uname }, ...(mail ? [{ email: mail }] : [])];
  if (await UserModel.exists({ $or: orConds })) throw new Error('DUPLICATE');

  const user = await UserModel.create({
    name: p.name.trim(),
    username: uname,
    ...(mail ? { email: mail } : {}),                   // ✅ 값 있을 때만 저장
    password: await hashPassword(p.password.trim()),
    role: p.role ?? 'USER',
  });

  return {
    id: String(user._id),
    name: user.name,
    username: user.username,
    ...(user.email ? { email: user.email } : {}),       // ✅ DTO도 조건부
    role: user.role as UserPublic['role'],
    createdAt: user.createdAt!.toISOString(),
  };
}


