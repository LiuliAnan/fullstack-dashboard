import { Alert } from '@mui/material';
import type { AgentMessage, ChartContent, ConfirmationContent, ReportContent, TableContent, TextContent } from '../types/agent-message';
import TextMessage from './messages/TextMessage';
import TableMessage from './messages/TableMessage';
import ChartMessage from './messages/ChartMessage';
import ReportMessage from './messages/ReportMessage';
import ConfirmationMessage from './messages/ConfirmationMessage';

export default function AgentMessageRenderer({ message }: { message: AgentMessage }) {
  switch (message.messageType) {
    case 'text': return <TextMessage content={message.content as TextContent} />;
    case 'table': return <TableMessage content={message.content as TableContent} />;
    case 'chart': return <ChartMessage content={message.content as ChartContent} />;
    case 'report': return <ReportMessage content={message.content as ReportContent} />;
    case 'confirmation': return <ConfirmationMessage content={message.content as ConfirmationContent} />;
    default: return <Alert severity="warning">Unsupported message type.</Alert>;
  }
}
