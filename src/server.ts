import express from 'express';
import cors from 'cors';
import { ENV } from './env';
import { logistics } from './routes/logistics';
import { loginUser } from './controllers/user';

const app = express();
app.use(cors({ origin: ['http://localhost:3000','http://localhost:4000'] }));
app.use(express.json());

// 헬스체크(서버가 떠있는지만 확인)
app.get('/health', (_req, res) => res.json({ ok: true }));

// 물류 라우트(최종 경로: /api/logistics/weight-bins)
app.use('/api/logistics', logistics);

//login
app.use('api/usrs/login', loginUser)
app.listen(ENV.PORT, '0.0.0.0', () => {
  console.log(`[server] http://localhost:${ENV.PORT} (${ENV.NODE_ENV})`);
});