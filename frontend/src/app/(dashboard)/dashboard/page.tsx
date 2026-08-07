'use client';

import { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography, Grid } from '@mui/material';
import DashboardStatsCards from '@/components/DashboardStatsCards';
import DashboardLevelChart from '@/components/DashboardLevelChart';
import DashboardFoundedTrend from '@/components/DashboardFoundedTrend';
import apiClient from '@/lib/api-client';
import type { DashboardData } from '@/types/api';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/api/dashboard');
        setData(res.data);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* 数据卡 */}
      <DashboardStatsCards stats={data.stats} />

      {/* 环形图（左 1/3）+ 折线图（右 2/3）并排，窄屏自动堆叠 */}
      <Grid container spacing={3} sx={{ mt: 3 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardLevelChart data={data.levelDistribution} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <DashboardFoundedTrend data={data.foundedTrend} />
        </Grid>
      </Grid>
    </Box>
  );
}