import { Router } from "express";
import { getCollection } from "../database/mongo";
import { ENV } from "../env";

export function getLogisticsData(req: Request, res: Response) {
// routes/logistics.ts (확인)
Router.get('/weight-bins', async (_req: any, res: { json: (arg0: any) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): void; new(): any; }; }; }) => {
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
}