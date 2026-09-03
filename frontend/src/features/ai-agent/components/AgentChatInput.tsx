'use client';
import { ChangeEvent, KeyboardEvent, useRef } from 'react';
import { AttachFile, Close, Send } from '@mui/icons-material';
import { Box, Chip, CircularProgress, IconButton, Stack, TextField, Tooltip } from '@mui/material';
import type { AgentAttachment } from '../types/agent-message';

interface Props {
  value: string; onChange: (value: string) => void; onSend: () => void;
  attachments: AgentAttachment[]; onRemoveAttachment: (id: string) => void;
  onUpload: (files: File[]) => void; sending: boolean; uploading: boolean;
}

export default function AgentChatInput(props: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); props.onSend(); }
  };
  const onFiles = (event: ChangeEvent<HTMLInputElement>) => { props.onUpload(Array.from(event.target.files ?? [])); event.target.value = ''; };
  return <Box sx={{ borderTop: 1, borderColor: 'divider', p: 1.5, bgcolor: 'background.paper' }}>
    {!!props.attachments.length && <Stack direction="row" sx={{ gap: 0.75, flexWrap: 'wrap', mb: 1 }}>{props.attachments.map((file) => <Chip key={file.id} size="small" label={file.name} onDelete={() => props.onRemoveAttachment(file.id)} deleteIcon={<Close />} />)}</Stack>}
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-end' }}>
      <input ref={fileRef} hidden multiple type="file" accept=".pdf,.txt,.csv,.png,.jpg,.jpeg" onChange={onFiles} />
      <Tooltip title="Attach files"><span><IconButton disabled={props.uploading} onClick={() => fileRef.current?.click()}>{props.uploading ? <CircularProgress size={22} /> : <AttachFile />}</IconButton></span></Tooltip>
      <TextField fullWidth multiline maxRows={5} size="small" placeholder="Message AI assistant…" value={props.value} onChange={(event) => props.onChange(event.target.value)} onKeyDown={onKeyDown} />
      <Tooltip title="Send"><span><IconButton color="primary" disabled={!props.value.trim() || props.sending} onClick={props.onSend}>{props.sending ? <CircularProgress size={22} /> : <Send />}</IconButton></span></Tooltip>
    </Stack>
  </Box>;
}
