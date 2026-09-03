'use client';

import { useCallback, useEffect, useState } from 'react';
import { createSession, loadSession, sendChatMessage, uploadChatFiles } from '../services/agent-api';
import type { AgentAttachment, AgentMessage } from '../types/agent-message';
import { chatStorage } from '../utils/message-storage';

export function useAgentChat() {
  const [open, setOpenState] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [draft, setDraftState] = useState('');
  const [attachments, setAttachments] = useState<AgentAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpenState(chatStorage.getOpen());
      setDraftState(chatStorage.getDraft());
      const stored = chatStorage.getSession();
      if (!stored) { setLoading(false); return; }
      loadSession(stored).then((session) => {
        setSessionId(session.id);
        setMessages(session.messages ?? []);
      }).catch(() => chatStorage.clearSession()).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const setOpen = useCallback((value: boolean) => { setOpenState(value); chatStorage.setOpen(value); }, []);
  const setDraft = useCallback((value: string) => { setDraftState(value); chatStorage.setDraft(value); }, []);

  const ensureSession = async () => {
    if (sessionId) return sessionId;
    const session = await createSession();
    setSessionId(session.id);
    chatStorage.setSession(session.id);
    return session.id;
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true); setError(null);
    setDraft('');
    const pendingId = `pending-${Date.now()}`;
    setMessages((current) => [...current, { id: pendingId, sessionId: sessionId ?? '', role: 'user', messageType: 'text', content: { text }, attachments, createdAt: new Date().toISOString(), status: 'sending' }]);
    try {
      const id = await ensureSession();
      const result = await sendChatMessage(id, text, attachments);
      setMessages((current) => [...current.filter((message) => message.id !== pendingId), { ...result.userMessage, status: 'sent' }, { ...result.assistantMessage, status: 'sent' }]);
      setAttachments([]);
    } catch (reason) {
      setMessages((current) => current.map((message) => message.id === pendingId ? { ...message, status: 'failed' } : message));
      setDraft(text);
      setError(reason instanceof Error ? reason.message : 'Message could not be sent');
    } finally { setSending(false); }
  };

  const upload = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true); setError(null);
    try {
      const uploaded = await uploadChatFiles(files);
      setAttachments((current) => [...current, ...uploaded]);
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'File upload failed'); }
    finally { setUploading(false); }
  };

  return { open, setOpen, messages, draft, setDraft, attachments, removeAttachment: (id: string) => setAttachments((items) => items.filter((item) => item.id !== id)), loading, sending, uploading, error, send, upload };
}
