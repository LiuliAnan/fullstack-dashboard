'use client';

import { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import CompanyToolbar from '@/components/CompanyToolbar';
import CompanyTable from '@/components/CompanyTable';
import apiClient from '@/lib/api-client';
import type { Company } from '@/types/api';

export default function CompanyPage() {
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  // 搜索防抖
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchCompanies = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (levelFilter.length) params.set('level', levelFilter.join(','));
    if (debouncedSearch) params.set('search', debouncedSearch);
    try {
      const res = await apiClient.get(`/api/companies?${params.toString()}`);
      setAllCompanies(res.data);
    } finally {
      setLoading(false);
    }
  };

  // 过滤条件变化时重新查询，重置到第一页
  useEffect(() => {
    setPage(0);
    fetchCompanies();
  }, [debouncedSearch, levelFilter]);

  // 客户端分页
  const pagedCompanies = allCompanies.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Company Management
      </Typography>

      <CompanyToolbar
        search={search}
        onSearchChange={setSearch}
        levelFilter={levelFilter}
        onLevelFilterChange={setLevelFilter}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <CompanyTable
          companies={pagedCompanies}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(r) => {
            setRowsPerPage(r);
            setPage(0);
          }}
          total={allCompanies.length}
        />
      )}
    </Box>
  );
}