'use client';

import { useState, useEffect, useCallback } from 'react';
import { Alert, Button, Typography, Box, CircularProgress } from '@mui/material';
import UserToolbar from '@/components/UserToolbar';
import UserTable from '@/components/UserTable';
import UserFormDialog from '@/components/UserFormDialog';
import apiClient from '@/lib/api-client';
import type { PaginatedResponse, UserListItem } from '@/types/api';

export default function UserPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 搜索防抖：输入后延迟 300ms 才发请求，避免每次按键都请求
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (roleFilter.length) params.set('role', roleFilter.join(','));
    if (debouncedSearch) params.set('search', debouncedSearch);
    params.set('page', String(page + 1));
    params.set('pageSize', String(rowsPerPage));
    try {
      const res = await apiClient.get<PaginatedResponse<UserListItem>>(
        `/api/users?${params.toString()}`,
      );
      setUsers(res.data.items);
      setTotal(res.data.total);
    } catch {
      setError('Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, roleFilter, rowsPerPage]);

  // 过滤条件变化时重新查询，并重置到第一页
  useEffect(() => {
    const timer = window.setTimeout(() => void fetchUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchUsers]);

  // ===== 选择 =====
  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? users.map((user) => user.id) : []);
  };

  // ===== 删除 =====
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    try {
      setError('');
      await apiClient.delete(`/api/users/${id}`);
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      await fetchUsers();
    } catch {
      setError('Unable to delete the user. Please try again.');
    }
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected users?`)) return;
    // axios DELETE 带 body 要用 { data: ... } 语法
    try {
      setError('');
      await apiClient.delete('/api/users', { data: { ids: selectedIds } });
      setSelectedIds([]);
      await fetchUsers();
    } catch {
      setError('Unable to delete the selected users. Please try again.');
    }
  };

  // ===== 添加/编辑 =====
  const handleAdd = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };
  const handleEdit = (user: UserListItem) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>

      <UserToolbar
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(0);
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={(value) => {
          setRoleFilter(value);
          setPage(0);
        }}
        selectedCount={selectedIds.length}
        onAdd={handleAdd}
        onBatchDelete={handleBatchDelete}
      />

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={<Button color="inherit" onClick={() => void fetchUsers()}>Retry</Button>}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : !error || users.length > 0 ? (
        <UserTable
          users={users}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          onEdit={handleEdit}
          onDelete={handleDelete}
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

      <UserFormDialog
        open={dialogOpen}
        user={editingUser}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchUsers}
      />
    </Box>
  );
}
