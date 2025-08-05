import express, { Request, Response } from 'express';
import { User, IUser } from '../models/User';

const router = express.Router();

// ✅ 사용자 생성
router.post('/create', async (req: Request<{}, {}, IUser>, res: Response) => {
  try {
    const { name, email, id, password } = req.body;

    if (!name || !email || !id || !password) {
      return res.status(400).json({ error: '필수 항목 누락' });
    }

    const existing = await User.findOne({ id });
    if (existing) {
      return res.status(409).json({ error: '이미 존재하는 ID입니다.' });
    }

    const newUser = new User({ name, email, id, password });
    const savedUser = await newUser.save();

    res.status(201).json(savedUser);
  } catch (err) {
    console.error('❌ 사용자 생성 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

// ✅ 사용자 목록 조회
router.get('/', async (req: Request, res: Response) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('❌ 사용자 목록 조회 실패:', err);
    res.status(500).json({ error: '서버 오류' });
  }
});

export default router;
