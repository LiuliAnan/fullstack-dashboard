'use client';
import { Close, SmartToyOutlined } from '@mui/icons-material';
import { Alert, Box, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import type { useAgentChat } from '../hooks/useAgentChat';
import AgentMessageList from './AgentMessageList';
import AgentChatInput from './AgentChatInput';

export default function AgentChatWindow({ chat }: { chat: ReturnType<typeof useAgentChat> }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return <Drawer anchor="right" open={chat.open} onClose={() => chat.setOpen(false)} slotProps={{ paper: { sx: { width: fullScreen ? '100%' : 440, maxWidth: '100%', bgcolor: 'grey.50' } } }}>
    <Stack sx={{ height: '100dvh' }}>
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', px: 2, py: 1.5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <SmartToyOutlined /><Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 700 }}>AI Assistant</Typography><Typography variant="caption" sx={{ opacity: 0.8 }}>Persistent multi-turn conversation</Typography></Box><IconButton color="inherit" onClick={() => chat.setOpen(false)}><Close /></IconButton>
      </Stack>
      {chat.error && <Alert severity="error" sx={{ borderRadius: 0 }}>{chat.error}</Alert>}
      <AgentMessageList messages={chat.messages} loading={chat.loading} />
      <AgentChatInput value={chat.draft} onChange={chat.setDraft} onSend={() => void chat.send()} attachments={chat.attachments} onRemoveAttachment={chat.removeAttachment} onUpload={(files) => void chat.upload(files)} sending={chat.sending} uploading={chat.uploading} />
    </Stack>
  </Drawer>;
}
