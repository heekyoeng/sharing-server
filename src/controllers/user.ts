// src/controllers/user.controller.ts
// 목적: 사용자 회원가입/인증 관련 컨트롤러. 입력 검증, 에러코드 매핑, DTO 반환에만 집중한다.

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/User';

// 공통 쿠키 옵션 (필요 시 사용)
const COOKIE_OPT = {
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: false,         // 로컬: false, 배포(HTTPS): true
  maxAge: 60 * 60 * 1000,
  path: '/' as const,
};

/** 회원가입: email은 선택. username(또는 id) 중복/이메일 중복 방지. */
export async function registerUser(req: Request, res: Response) {
  try {
    const raw = req.body ?? {};
    const name = (raw.name ?? '').trim();
    const username = (raw.username ?? raw.id ?? '').trim(); // id → username 호환
    const password = (raw.password ?? '').trim();
    const email = typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : '';

    if (!name || !username || !password) {
      return res.status(400).json({ error: '이름/아이디/비밀번호는 필수입니다.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: '비밀번호는 8자 이상이어야 합니다.' });
    }

    const orConds = [{ username }, ...(email ? [{ email }] : [])];
    const dup = await UserModel.exists({ $or: orConds });
    if (dup) return res.status(409).json({ error: '이미 사용 중인 아이디/이메일입니다.' });

    const hashed = await bcrypt.hash(password, Number(process.env.BCRYPT_SALT_ROUNDS ?? 12));
    const user = await UserModel.create({
      name,
      username,
      ...(email ? { email } : {}),
      password: hashed,
      role: 'USER',
    });

    // DTO 반환 (민감정보 제외)
    return res.status(201).json({
      user: {
        id: String(user._id),
        name: user.name,
        username: user.username,
        ...(user.email ? { email: user.email } : {}),
        role: user.role,
        createdAt: user.createdAt?.toISOString(),
      },
    });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: '중복된 아이디/이메일입니다.' });
    }
    console.error('[registerUser] error:', err);
    return res.status(500).json({ error: '서버 오류' });
  }
}

/** 로그인: username(id 호환)로 조회 후 비밀번호 비교. 토큰 발급 로직은 프로젝트 정책에 맞춰 교체. */
export async function loginUser(req: Request, res: Response) {
  try {
    const raw = req.body ?? {};
    const username = (raw.username ?? raw.id ?? '').trim();
    const password = (raw.password ?? '').trim();
    if (!username || !password) {
      return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력하세요.' });
    }

    const user = await UserModel.findOne({ username }).select('+password');
    if (!user) return res.status(401).json({ error: '아이디 혹은 비밀번호가 틀렸습니다.' });

    const ok = await bcrypt.compare(password, user.password as unknown as string);
    if (!ok) return res.status(401).json({ error: '아이디 혹은 비밀번호가 틀렸습니다.' });

    // TODO: JWT/세션 발급으로 교체
    // const token = issueToken({ uid: String(user._id), role: user.role });
    // res.cookie('token', token, COOKIE_OPT);
    res.cookie('role', user.role, COOKIE_OPT);

    return res.json({ message: '로그인 성공', role: user.role });
  } catch (err) {
    console.error('[loginUser] error:', err);
    return res.status(500).json({ error: '서버 오류' });
  }
}

/** 내 정보: 쿠키/미들웨어에 따라 구현. 여기선 role 쿠키만 간단 확인. */
export function getMe(req: Request, res: Response) {
  const role = req.cookies?.role;
  if (!role) return res.status(401).json({ error: '로그인되지 않았습니다.' });
  return res.json({ role });
}

/** 사용자 목록: 운영/테스트용. 민감정보 제외. */
export async function getUsers(_req: Request, res: Response) {
  try {
    const users = await UserModel.find({}, { name: 1, username: 1, email: 1, role: 1, createdAt: 1 })
      .sort({ createdAt: -1 })
      .lean({ virtuals: true });
    return res.json(users);
  } catch (err) {
    console.error('[getUsers] error:', err);
    return res.status(500).json({ error: '서버 오류' });
  }
}


//로그아웃
export const logoutUser = (req: Request, res: Response) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === "production", // prod일 때만 true
      domain: 'localhost',
      path: "/", // ✅ 로그인 때 설정한 path와 동일해야 함
      
    })
    .clearCookie('role', {
      httpOnly: true,
      sameSite: 'lax',
     secure: process.env.NODE_ENV === "production", // prod일 때만 true
      domain: 'localhost',
      path: "/", // ✅ 로그인 때 설정한 path와 동일해야 함
 
    })
    .json({ message: '로그아웃 성공' });
};  