// 根据盈利效率值返回背景颜色（红->黄->绿 渐变）
// 值越高（每人创收越多）越绿，越低越红
export function getProfitColor(value: number): string {
  if (value >= 500) return '#c8e6c9'; // 深绿 - 高效
  if (value >= 300) return '#dcedc8'; // 浅绿
  if (value >= 150) return '#fff9c4'; // 黄 - 中等
  if (value >= 50) return '#ffe0b2'; // 橙
  return '#ffcdd2'; // 红 - 低效
}

// 根据盈利效率值返回文字描述
export function getProfitLabel(value: number): string {
  if (value >= 500) return 'High';
  if (value >= 300) return 'Good';
  if (value >= 150) return 'Medium';
  if (value >= 50) return 'Low';
  return 'Poor';
}