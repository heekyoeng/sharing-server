import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'your_default_secret';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies.token;
  console.log('[authMiddleware] 쿠키에서 추출한 토큰:', token);

  if (!token) {
    
    return res.status(401).json({ message: '인증되지 않음' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    (req as any).user = decoded;
    console.log('[authMiddleware] 디코딩 성공:', decoded);
    next();
  } catch (err) {
    return res.status(401).json({ message: '토큰이 유효하지 않음' });
  }
};


