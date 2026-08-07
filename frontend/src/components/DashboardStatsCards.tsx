'use client';

import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PublicIcon from '@mui/icons-material/Public';
import GroupsIcon from '@mui/icons-material/Groups';
import type { DashboardStats } from '@/types/api';
import { formatNumber } from '@/lib/format';

interface Props {
  stats: DashboardStats;
}

// 4 张数据卡配置
const cards = [
  { key: 'companyCount', label: 'Companies', icon: <BusinessIcon />, color: '#1976d2' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: <AttachMoneyIcon />, color: '#2e7d32' },
  { key: 'countryCount', label: 'Countries', icon: <PublicIcon />, color: '#ed6c02' },
  { key: 'employeeCount', label: 'Employees', icon: <GroupsIcon />, color: '#9c27b0' },
] as const;

export default function DashboardStatsCards({ stats }: Props) {
  return (
    <Grid container spacing={3}>
      {cards.map((card) => {
        const value = stats[card.key];
        // 覆盖国家数不换算（8 不显示成 8.00K），其他大数字换算
        const display = card.key === 'countryCount' ? value.toString() : formatNumber(value);
        return (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.key}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      bgcolor: card.color,
                      color: '#fff',
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      mr: 1.5,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {card.label}
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {display}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}