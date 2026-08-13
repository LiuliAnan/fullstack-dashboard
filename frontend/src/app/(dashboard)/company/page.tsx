'use client';

import { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Typography, Box, CircularProgress } from '@mui/material';
import CompanyToolbar from '@/components/CompanyToolbar';
import CompanyTable from '@/components/CompanyTable';
import apiClient from '@/lib/api-client';
import type { Company, PaginatedResponse } from '@/types/api';

export default function CompanyPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 搜索防抖
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCompanies = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (levelFilter.length) params.set('level', levelFilter.join(','));
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('page', String(page + 1));
    params.set('pageSize', String(rowsPerPage));
    try {
      const res = await apiClient.get<PaginatedResponse<Company>>(
        `/api/companies?${params.toString()}`,
      );
      setCompanies(res.data.items);
      setTotal(res.data.total);
    } catch {
      setError('Unable to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, levelFilter, page, rowsPerPage]);

  // 过滤条件变化时重新查询，重置到第一页
  useEffect(() => {
    const timer = window.setTimeout(() => void fetchCompanies(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchCompanies]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Company Management
      </Typography>

      <CompanyToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        levelFilter={levelFilter}
        onLevelFilterChange={(value) => {
          setLevelFilter(value);
          setPage(0);
        }}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={<Button color="inherit" onClick={() => void fetchCompanies()}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !error || companies.length > 0 ? (
        <CompanyTable
          companies={companies}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          total={total}
        />
      ) : null}
    </Box>
  );
}
