'use client';

import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Card, CardContent, Typography, Box, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import type { LevelDistributionItem } from '@/types/api';

// 注册 Chart.js 需要的组件
ChartJS.register(ArcElement, Tooltip, Legend);

interface Props {
  data: LevelDistributionItem[];
}

// 每个 level 一种颜色
const LEVEL_COLORS: Record<number, string> = {
  1: '#1976d2', // 蓝
  2: '#2e7d32', // 绿
  3: '#ed6c02', // 橙
  4: '#9c27b0', // 紫
};

export default function DashboardLevelChart({ data }: Props) {
  // 计算总数（圆环中心显示）
  const total = data.reduce((sum, d) => sum + d.count, 0);

  const chartData = {
    labels: data.map((d) => `Level ${d.level}`),
    datasets: [
      {
        data: data.map((d) => d.count),
        backgroundColor: data.map((d) => LEVEL_COLORS[d.level] || '#999'),
        borderWidth: 2,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    plugins: {
      legend: { display: false },  // 用下方数据表格代替图例
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const item = data[ctx.dataIndex];
            return ` ${item.count} companies (${item.percentage.toFixed(2)}%)`;
          },
        },
      },
    },
    maintainAspectRatio: false,
    cutout: '65%',
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Company Distribution by Level
        </Typography>
        {/* 圆环 + 中心总数 */}
        <Box sx={{ position: 'relative', height: 220, mb: 1 }}>
          <Doughnut data={chartData} options={options} />
          <Box
            sx={{
              position: 'absolute',
              top: '45%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {total.toLocaleString()}
            </Typography>
          </Box>
        </Box>
        {/* 紧凑数据表格（代替图例，同时展示量和百分比）*/}
        <Table size="small" sx={{ '& .MuiTableCell-root': { py: 0.5, px: 1 } }}>
          <TableHead>
            <TableRow>
              <TableCell>Level</TableCell>
              <TableCell align="right">Count</TableCell>
              <TableCell align="right">%</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((d) => (
              <TableRow key={d.level}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: LEVEL_COLORS[d.level] || '#999',
                        flexShrink: 0,
                      }}
                    />
                    L{d.level}
                  </Box>
                </TableCell>
                <TableCell align="right">{d.count}</TableCell>
                <TableCell align="right">{d.percentage.toFixed(2)}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}