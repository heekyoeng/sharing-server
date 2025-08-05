import express from 'express';
import { connectMongo } from './database/mongo'; // 위에서 만든 연결 함수
import userRouter from './routes/user';

const app = express();
const PORT = 4000;

app.get('/', (_, res) => {
  res.send('백엔드 서버가 작동 중입니다!');
});
app.use(express.json());

connectMongo(); // MongoDB 연결 수행

app.get('/', (req, res) => {
  res.send('Hello Mongo!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
app.use('/api/users', userRouter);