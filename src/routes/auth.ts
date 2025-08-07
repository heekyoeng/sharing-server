import express from 'express';
import { logoutUser } from '../controllers/user';

const router = express.Router();

router.post('/logout', logoutUser); //  로그아웃 API

export default router;
