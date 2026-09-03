import { DescriptionOutlined } from '@mui/icons-material';
import { Button, Paper, Stack, Typography } from '@mui/material';
import type { ReportContent } from '../../types/agent-message';

export default function ReportMessage({ content }: { content: ReportContent }) {
  return <Paper variant="outlined" sx={{ p: 1.5 }}><Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}><DescriptionOutlined color="primary" /><Stack sx={{ flex: 1 }}><Typography sx={{ fontWeight: 700 }}>{content.title}</Typography><Typography variant="body2" color="text.secondary">{content.summary}</Typography>{content.url && <Button href={content.url} target="_blank" size="small" sx={{ alignSelf: 'flex-start', mt: 1 }}>Preview report</Button>}</Stack></Stack></Paper>;
}
