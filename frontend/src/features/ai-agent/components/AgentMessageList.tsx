'use client';
import { useEffect, useRef } from 'react';
import { AttachFile, SmartToyOutlined } from '@mui/icons-material';
import { Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import type { AgentMessage } from '../types/agent-message';
import AgentMessageRenderer from './AgentMessageRenderer';

export default function AgentMessageList({ messages, loading }: { messages: AgentMessage[]; loading: boolean }) {
  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  if (loading) return <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><CircularProgress size={28} /></Stack>;
  if (!messages.length) return <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', px: 4 }}><SmartToyOutlined sx={{ fontSize: 46, color: 'primary.main', mb: 1 }} /><Typography variant="h6">How can I help?</Typography><Typography variant="body2" color="text.secondary">Ask a question or attach a file to start a persistent conversation.</Typography></Stack>;
  return <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
    {messages.map((message) => <Stack key={message.id} sx={{ alignItems: message.role === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>{message.role === 'user' ? 'You' : 'AI assistant'}</Typography>
      <Box sx={{ maxWidth: '88%', px: 1.75, py: 1.1, borderRadius: 2.5, bgcolor: message.role === 'user' ? 'primary.main' : 'background.paper', color: message.role === 'user' ? 'primary.contrastText' : 'text.primary', border: message.role === 'user' ? 0 : 1, borderColor: 'divider', opacity: message.status === 'sending' ? 0.65 : 1 }}>
        <AgentMessageRenderer message={message} />
        {!!message.attachments?.length && <Stack direction="row" sx={{ gap: 0.5, flexWrap: 'wrap', mt: 1 }}>{message.attachments.map((file) => <Chip key={file.id} size="small" icon={<AttachFile />} label={file.name} />)}</Stack>}
        {message.status === 'failed' && <Typography variant="caption" color="error.light">Failed to send. Your draft was restored.</Typography>}
      </Box>
    </Stack>)}<div ref={bottomRef} />
  </Box>;
}
