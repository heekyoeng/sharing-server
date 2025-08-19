import { Router } from 'express';

import { ENV } from '../env';
import { getCollection } from '../database/mongo';

export const logistics = Router();

// routes/logistics.ts (확인)
logistics.get('/weight-bins', async (_req, res) => {
  try {
    const col = await getCollection(ENV.OUT_COL); // ENV.OUT_COL = shipments_weight_bins
    const rows = await col.find({}, { projection: { _id: 0 } })
                          .sort({ binCenter: 1 })
                          .toArray();
    res.json(rows);
  } catch (e: any) {
    console.error('[weight-bins]', e?.message ?? e); // ← 서버 콘솔에 원인 표시
    res.status(500).json({ error: 'failed_to_fetch_weight_bins' });
  }
});
