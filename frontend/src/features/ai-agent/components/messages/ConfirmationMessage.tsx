'use client';
import { useState } from 'react';
import { Button, Paper, Stack, Typography } from '@mui/material';
import type { ConfirmationContent } from '../../types/agent-message';

export default function ConfirmationMessage({ content }: { content: ConfirmationContent }) {
  const [choice, setChoice] = useState<'confirmed' | 'cancelled' | null>(null);
  return <Paper variant="outlined" sx={{ p: 1.5 }}><Typography sx={{ fontWeight: 700 }}>{content.title}</Typography><Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>{content.description}</Typography>
    {choice ? <Typography color={choice === 'confirmed' ? 'success.main' : 'text.secondary'}>Action {choice}.</Typography> : <Stack direction="row" spacing={1}><Button variant="contained" size="small" onClick={() => setChoice('confirmed')}>{content.confirmLabel ?? 'Confirm'}</Button><Button size="small" onClick={() => setChoice('cancelled')}>{content.cancelLabel ?? 'Cancel'}</Button></Stack>}
  </Paper>;
}
