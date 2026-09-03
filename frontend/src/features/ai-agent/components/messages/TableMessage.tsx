import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { TableContent } from '../../types/agent-message';

export default function TableMessage({ content }: { content: TableContent }) {
  return <Paper variant="outlined" sx={{ overflowX: 'auto' }}>
    {content.title && <Typography sx={{ p: 1.5, fontWeight: 700 }}>{content.title}</Typography>}
    <Table size="small"><TableHead><TableRow>{content.columns.map((column) => <TableCell key={column}>{column}</TableCell>)}</TableRow></TableHead>
      <TableBody>{content.rows.map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cell}</TableCell>)}</TableRow>)}</TableBody>
    </Table>
  </Paper>;
}
