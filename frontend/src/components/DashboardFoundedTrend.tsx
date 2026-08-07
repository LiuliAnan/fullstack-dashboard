'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Card, CardContent, Typography, Box } from '@mui/material';
import type { FoundedTrendItem } from '@/types/api';

// 注册折线图需要的组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

interface Props {
  data: FoundedTrendItem[];
}

export default function DashboardFoundedTrend({ data }: Props) {
  const chartData = {
    labels: data.map((d) => d.year),
    datasets: [
      {
        label: 'Cumulative Companies',
        data: data.map((d) => d.cumulative),
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.15)',
        fill: true,           // 填充曲线下方
        tension: 0.4,         // 更平滑的曲线
        pointRadius: 0,       // 不显示圆点
        pointHoverRadius: 6,  // hover 时才显示圆点
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: any) => `Year ${items[0].label}`,
          label: (ctx: any) => ` ${ctx.parsed.y} companies`,
        },
      },
    },
    scales: {
      x: {
        // 数据点多时，X 轴只显示部分标签避免拥挤
        ticks: {
          maxTicksLimit: 12,
          autoSkip: true,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val: any) => (val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val),
        },
      },
    },
    maintainAspectRatio: false,
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%', '&:last-child': { pb: 2 } }}>
        <Typography variant="h6" gutterBottom>
          Supply Chain Network Growth (Cumulative)
        </Typography>
        <Box sx={{ position: 'relative', flex: 1, minHeight: 300 }}>
          <Line data={chartData} options={options} />
        </Box>
      </CardContent>
    </Card>
  );
}