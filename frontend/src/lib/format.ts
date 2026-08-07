// 大数字单位换算：K(千) / M(百万) / B(十亿)
// 182779175 -> "182.78M"，699119 -> "699.12K"，8 -> "8"
export function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toString();
}