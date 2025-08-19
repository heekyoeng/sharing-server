import { Router } from 'express';
import { getWeightBins } from '../controllers/logistics';


const logisticsRouter = Router();

// GET /api/logistics/weight-bins
logisticsRouter.get('/weight-bins', getWeightBins);

// 진단용 핑 (라우터가 정말 물렸는지 확인)
logisticsRouter.get('/ping', (_req, res) => res.json({ ok: true, scope: 'logistics' }));

export default logisticsRouter;