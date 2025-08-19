export interface WeightBinPoint {
  binMin: number;
  binMax: number;
  binCenter: number;
  total: number;
  onTimeRate: number; // 0~1
  computedAt?: string;
}
