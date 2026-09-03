'use client';
import { Box, Chip, LinearProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

const tasks = [
  { id: 'T-1042', task: 'Summarize supplier report', session: 'Supply chain review', status: 'completed', progress: 100, model: 'DeepSeek', updated: '10:42' },
  { id: 'T-1043', task: 'Compare company revenue', session: 'Company analysis', status: 'running', progress: 64, model: 'Qwen', updated: '10:46' },
  { id: 'T-1044', task: 'Prepare risk checklist', session: 'Risk review', status: 'pending', progress: 0, model: 'GPT', updated: '10:48' },
  { id: 'T-1045', task: 'Generate weekly brief', session: 'Management brief', status: 'failed', progress: 38, model: 'Kimi', updated: '10:51' },
];

const colors = { completed: 'success', running: 'primary', pending: 'warning', failed: 'error' } as const;

export default function AgentTasksPage() {
  return <Box sx={{ pb: 12 }}><Typography variant="h4" sx={{ fontWeight: 700, mb: 0.75 }}>Agent Tasks</Typography><Typography color="text.secondary" sx={{ mb: 3 }}>Task progress preview. Workflow orchestration will be connected in a later iteration.</Typography>
    <TableContainer component={Paper} variant="outlined"><Table><TableHead><TableRow><TableCell>Task</TableCell><TableCell>Session</TableCell><TableCell>Status</TableCell><TableCell sx={{ minWidth: 180 }}>Progress</TableCell><TableCell>Model</TableCell><TableCell>Updated</TableCell></TableRow></TableHead>
      <TableBody>{tasks.map((task) => <TableRow key={task.id} hover><TableCell><Typography sx={{ fontWeight: 600 }}>{task.task}</Typography><Typography variant="caption" color="text.secondary">{task.id}</Typography></TableCell><TableCell>{task.session}</TableCell><TableCell><Chip size="small" color={colors[task.status as keyof typeof colors]} label={task.status} /></TableCell><TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LinearProgress variant="determinate" value={task.progress} color={task.status === 'failed' ? 'error' : 'primary'} sx={{ flex: 1, height: 7, borderRadius: 4 }} /><Typography variant="caption">{task.progress}%</Typography></Box></TableCell><TableCell>{task.model}</TableCell><TableCell>{task.updated}</TableCell></TableRow>)}</TableBody>
    </Table></TableContainer>
  </Box>;
}
