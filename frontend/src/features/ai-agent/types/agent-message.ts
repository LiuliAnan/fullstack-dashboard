export type AgentMessageRole = 'user' | 'assistant' | 'system';
export type AgentMessageType = 'text' | 'table' | 'chart' | 'report' | 'confirmation';

export interface AgentAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
}

export interface TextContent { text: string }
export interface TableContent { title?: string; columns: string[]; rows: Array<Array<string | number>> }
export interface ChartContent { title: string; items: Array<{ label: string; value: number }> }
export interface ReportContent { title: string; summary: string; url?: string }
export interface ConfirmationContent { title: string; description: string; confirmLabel?: string; cancelLabel?: string }

export type AgentMessageContent = TextContent | TableContent | ChartContent | ReportContent | ConfirmationContent;

export interface AgentMessage {
  id: string;
  sessionId: string;
  role: AgentMessageRole;
  messageType: AgentMessageType;
  content: AgentMessageContent;
  attachments: AgentAttachment[];
  createdAt: string;
  status?: 'sending' | 'sent' | 'failed';
}

export interface AgentSession {
  id: string;
  title: string;
  modelProvider: string;
  modelName: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages?: AgentMessage[];
}
