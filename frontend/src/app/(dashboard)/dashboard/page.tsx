'use client';

import { useState, useEffect, useCallback } from 'react';
import { Alert, Box, Button, CircularProgress, Typography, Grid } from '@mui/material';
import DashboardStatsCards from '@/components/DashboardStatsCards';
import DashboardLevelChart from '@/components/DashboardLevelChart';
import DashboardFoundedTrend from '@/components/DashboardFoundedTrend';
import apiClient from '@/lib/api-client';
import type { DashboardData } from '@/types/api';
import DashboardCompanyBarChart from '@/components/DashboardCompanyBarChart';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/api/dashboard');
      setData(res.data);
    } catch {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Alert
          severity="error"
          action={<Button color="inherit" onClick={() => void fetchData()}>Retry</Button>}
        >
          {error || 'Dashboard data is unavailable.'}
        </Alert>
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

      <DashboardCompanyBarChart />
    </Box>
  );
}
