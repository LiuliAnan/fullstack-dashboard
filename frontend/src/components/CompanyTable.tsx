'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Box,
  TablePagination,
  Collapse,
  Typography,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import type { Company } from '@/types/api';
import { getProfitColor, getProfitLabel } from '@/lib/profit-color';

interface Props {
  companies: Company[];
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  total: number;
}

// 单行（含折叠内容）
function CompanyRow({ company }: { company: Company }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 外层行 */}
      <TableRow hover>
        <TableCell>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{company.company_name}</TableCell>
        <TableCell>{company.level}</TableCell>
        <TableCell>{company.country}</TableCell>
        <TableCell
          sx={{
            backgroundColor: getProfitColor(company.profit_efficiency || 0),
            fontWeight: 'bold',
          }}
        >
          {company.profit_efficiency}{' '}
          <Typography component="span" variant="caption" color="text.secondary">
            ({getProfitLabel(company.profit_efficiency || 0)})
          </Typography>
        </TableCell>
      </TableRow>

      {/* 折叠行：单独一个 TableRow，里面一个跨列 TableCell 包 Collapse */}
      <TableRow>
        <TableCell sx={{ pb: 0, pt: 0 }} colSpan={5}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Company Details
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                <Typography variant="body2">
                  <strong>City:</strong> {company.city}
                </Typography>
                <Typography variant="body2">
                  <strong>Founded Year:</strong> {company.founded_year}
                </Typography>
                <Typography variant="body2">
                  <strong>Annual Revenue:</strong> {company.annual_revenue.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Employees:</strong> {company.employees.toLocaleString()}
                </Typography>
                {company.parent_company_name && (
                  <Typography variant="body2">
                    <strong>Parent Company:</strong> {company.parent_company_name}
                  </Typography>
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function CompanyTable({
  companies,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  total,
}: Props) {
  return (
    <Paper>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Level</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Profit Efficiency (Revenue / Employees)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {companies.map((company) => (
              <CompanyRow key={company.company_code} company={company} />
            ))}
            {companies.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  No companies found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={total}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        onRowsPerPageChange={(e) => onRowsPerPageChange(Number(e.target.value))}
        rowsPerPageOptions={[10, 25, 50]}
      />
    </Paper>
  );
}