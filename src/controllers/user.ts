import { Request, Response } from 'express';
import { handleCreateUser, handleGetUsers, handleLogin } from '../services/user';
import bcrypt from 'bcrypt';
import { User } from '../models/User';

//로그인
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { id, password } = req.body;
    const result = await handleLogin(id, password); // result.token, result.role 포함

    //  토큰 쿠키 저장
    res
      .cookie('token', result.token, {
        httpOnly: true,
        sameSite: 'lax',      //  프론트/백 분리 대응
        secure: false,        // 로컬 환경
        domain: 'localhost',  //  필요시 추가 (실제 배포시 제거)
        maxAge: 60 * 60 * 1000,
      })

      // 🎖️ 역할 쿠키 저장 (role이 없으면 getMe에서 401 발생)
      .cookie('role', result.role, {
        httpOnly: true,       // 클라이언트에서 role 직접 접근 안 해도 되면 true
        sameSite: 'lax',
        secure: false,
        domain: 'localhost',
        maxAge: 60 * 60 * 1000,
      })

      // 📨 응답
      .json({ message: '로그인 성공', role: result.role });

 } catch (err: any) {
  res.status(401).json({ error: '아이디 혹은 비밀번호가 틀렸습니다.' });
}
};



export const createUser = async (req: Request, res: Response) => {
  try {
    const savedUser = await handleCreateUser(req.body);
    res.status(201).json(savedUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await handleGetUsers();
    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

//회원가입

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { name, id, email, password } = req.body;

    if (!name || !id || !password) {
      return res.status(400).json({ error: '필수 항목이 누락되었습니다.' });
    }

    // 중복 확인
    const existingUser = await User.findOne({ id });
    if (existingUser) {
      return res.status(409).json({ error: '이미 사용 중인 아이디입니다.' });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 저장
    const newUser = new User({
      name,
      id,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({ message: '회원가입 성공' });
  } catch (err) {
    console.error('회원가입 오류:', err);
    return res.status(500).json({ error: '서버 오류' });
  }
};



export const getMe = (req: Request, res: Response) => {
  const token = req.cookies?.token;
  const role = req.cookies?.role;
  const userId = (req as any).user?.id;

  if (!token || !role) {
    return res.status(401).json({ error: '로그인되지 않았습니다.' });
  }

  return res.json({ role, userId });
};
//로그아웃
export const logoutUser = (req: Request, res: Response) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      domain: 'localhost',
    })
    .clearCookie('role', {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      domain: 'localhost',
    })
    .json({ message: '로그아웃 성공' });
};