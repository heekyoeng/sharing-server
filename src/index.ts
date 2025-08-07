import express from 'express';
import { connectMongo } from './database/mongo';
import userRouter from './routes/user';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/auth'; //  추가: auth 라우터 import

const app = express();
const PORT = 4000;

//  CORS 설정 (프론트 주소와 쿠키 허용)
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

//  공통 미들웨어
app.use(express.json());
app.use(cookieParser());

//  헬스 체크 라우트 (1회만)
app.get('/', (_, res) => {
  res.send('백엔드 서버가 작동 중입니다!');
});

//  DB 연결
connectMongo();

//  사용자 라우터
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter); // ✅ 추가: /api/auth/logout 같은 경로 대응
// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
