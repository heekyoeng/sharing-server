import express from 'express';
import { createUser, getUsers, loginUser, logoutUser } from '../controllers/user';
import { registerUser } from '../controllers/user';
import { getMe } from '../controllers/user';
import { authMiddleware } from '../middlewares/user'; // 전하께서 올리신 그 파일

const router = express.Router();

router.post('/login', loginUser);
router.post('/create', createUser);
router.post('/register', registerUser);
router.get('/me', authMiddleware, getMe); // 인증 필요
router.get('/', getUsers);
router.post('/logout', logoutUser); //  로그아웃 라우트 등록

export default router;
