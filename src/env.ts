import 'dotenv/config';
export const ENV = {
  PORT: Number(process.env.PORT ?? 5000),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  MONGO_URI: process.env.MONGO_URI ?? '',
  MONGO_DB: process.env.MONGO_DB ?? 'logistics',
  OUT_COL: process.env.MONGO_COL_OUT ?? 'shipments_weight_bins',
};
if (!ENV.MONGO_URI) console.warn('[env] MONGO_URI is empty (only read routes will fail)');