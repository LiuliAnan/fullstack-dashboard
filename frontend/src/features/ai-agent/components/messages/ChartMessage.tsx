import { Box, Paper, Typography } from '@mui/material';
import type { ChartContent } from '../../types/agent-message';

export default function ChartMessage({ content }: { content: ChartContent }) {
  const max = Math.max(...content.items.map((item) => item.value), 1);
  return <Paper variant="outlined" sx={{ p: 1.5 }}><Typography sx={{ fontWeight: 700, mb: 1 }}>{content.title}</Typography>
    {content.items.map((item) => <Box key={item.label} sx={{ display: 'grid', gridTemplateColumns: '90px 1fr 42px', gap: 1, alignItems: 'center', mb: 0.75 }}>
      <Typography variant="caption" noWrap>{item.label}</Typography><Box sx={{ height: 10, bgcolor: 'grey.200', borderRadius: 5 }}><Box sx={{ height: '100%', width: `${item.value / max * 100}%`, bgcolor: 'primary.main', borderRadius: 5 }} /></Box><Typography variant="caption">{item.value}</Typography>
    </Box>)}
  </Paper>;
}
