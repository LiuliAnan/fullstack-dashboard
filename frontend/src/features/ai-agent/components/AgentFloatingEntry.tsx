'use client';
import { Send, SmartToyOutlined } from '@mui/icons-material';
import { InputAdornment, Paper, TextField } from '@mui/material';
import { useAgentChat } from '../hooks/useAgentChat';
import AgentChatWindow from './AgentChatWindow';

export default function AgentFloatingEntry() {
  const chat = useAgentChat();
  return <>
    {!chat.open && <Paper elevation={8} sx={{ position: 'fixed', zIndex: 1200, right: { xs: 16, sm: 28 }, bottom: { xs: 16, sm: 28 }, width: { xs: 'calc(100% - 32px)', sm: 340 }, borderRadius: 4 }}>
      <TextField fullWidth placeholder="Ask AI assistant…" onClick={() => chat.setOpen(true)} onFocus={() => chat.setOpen(true)} slotProps={{ input: { readOnly: true, startAdornment: <InputAdornment position="start"><SmartToyOutlined color="primary" /></InputAdornment>, endAdornment: <InputAdornment position="end"><Send color="action" /></InputAdornment>, sx: { borderRadius: 4 } } }} />
    </Paper>}
    <AgentChatWindow chat={chat} />
  </>;
}
