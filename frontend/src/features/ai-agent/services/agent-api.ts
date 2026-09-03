import apiClient from '@/lib/api-client';
import type { AgentAttachment, AgentMessage, AgentSession } from '../types/agent-message';

export async function createSession(): Promise<AgentSession> {
  const { data } = await apiClient.post<AgentSession>('/api/ai-agent/sessions', {});
  return data;
}

export async function loadSession(id: string): Promise<AgentSession> {
  const { data } = await apiClient.get<AgentSession>(`/api/ai-agent/sessions/${id}`);
  return data;
}

export async function sendChatMessage(sessionId: string, message: string, attachments: AgentAttachment[]) {
  const { data } = await apiClient.post<{ userMessage: AgentMessage; assistantMessage: AgentMessage; provider: string; model: string }>('/api/ai-agent/chat', { sessionId, message, attachments });
  return data;
}

export async function uploadChatFiles(files: File[]): Promise<AgentAttachment[]> {
  const body = new FormData();
  files.forEach((file) => body.append('files', file));
  const { data } = await apiClient.post<AgentAttachment[]>('/api/ai-agent/files', body, { headers: { 'Content-Type': 'multipart/form-data' } });
  return data;
}
