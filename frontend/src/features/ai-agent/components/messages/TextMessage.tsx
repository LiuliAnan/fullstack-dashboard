import { Box } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { TextContent } from '../../types/agent-message';

export default function TextMessage({ content }: { content: TextContent }) {
  return <Box sx={{ '& p': { my: 0.75 }, '& h1, & h2, & h3': { mt: 1.5, mb: 0.75 }, '& pre': { overflowX: 'auto', p: 1.5, bgcolor: 'grey.900', color: 'grey.100', borderRadius: 1 }, '& code': { fontFamily: 'monospace' }, '& ul, & ol': { pl: 2.5 } }}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{content.text}</ReactMarkdown>
  </Box>;
}
