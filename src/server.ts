import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user';
import logisticsRouter from './routes/logistics';
import { connectMongo } from './database/mongo';

const app = express();

// 요청 로그(무슨 경로가 들어오는지 확인)
app.use((req, _res, next) => {
  console.log('[REQ]', req.method, req.path);
  next();
});

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));

// ✅ 도메인 라우트: 404보다 먼저!
app.use('/api/users', userRouter);
app.use('/api/logistics', logisticsRouter);

// ✅ 404는 항상 라우트 뒤
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path, method: req.method });
});

// ✅ 에러 핸들러는 제일 마지막
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('[error]', err);
  res.status(500).json({ error: '서버 오류' });
});

(async () => {
  try {
    await connectMongo();
    const port = Number(process.env.PORT || 5000);

    // 등록된 라우트 목록 덤프(확정 진단)
    const dumpRoutes = (prefix: string, stack: any[]) => {
      for (const layer of stack) {
        if (layer.route?.path) {
          console.log(`[ROUTE] ${layer.route.stack[0].method.toUpperCase()} ${prefix}${layer.route.path}`);
        } else if (layer.name === 'router' && layer.handle?.stack) {
          dumpRoutes(prefix + (layer.regexp?.source?.includes('^\\/api\\/logistics\\/?$') ? '/api/logistics' : ''), layer.handle.stack);
        }
      }
    };
    // Express 내부 스택에서 라우트 나열
    // (환경에 따라 덤프가 다를 수 있으니 참고용)
    // @ts-ignore
    if (app._router?.stack) dumpRoutes('', app._router.stack);

    app.listen(port, '0.0.0.0', () => console.log(`[server] http://localhost:${port}`));
  } catch (e) {
    console.error('[startup] DB connect failed:', e);
    process.exit(1);
  }
})();
