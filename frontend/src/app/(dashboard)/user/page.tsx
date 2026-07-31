'use client';

import { useState, useEffect } from 'react';
import { Typography, Box, CircularProgress } from '@mui/material';
import UserToolbar from '@/components/UserToolbar';
import UserTable from '@/components/UserTable';
import UserFormDialog from '@/components/UserFormDialog';
import apiClient from '@/lib/api-client';
import type { UserListItem } from '@/types/api';

export default function UserPage() {
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);

  // 搜索防抖：输入后延迟 300ms 才发请求，避免每次按键都请求
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter.length) params.set('role', roleFilter.join(','));
    if (debouncedSearch) params.set('search', debouncedSearch);
    try {
      const res = await apiClient.get(`/api/users?${params.toString()}`);
      setAllUsers(res.data);
    } finally {
      setLoading(false);
    }
  };

  // 过滤条件变化时重新查询，并重置到第一页
  useEffect(() => {
    setPage(0);
    fetchUsers();
  }, [debouncedSearch, roleFilter]);

  // 客户端分页：从全量数据切出当前页
  const pagedUsers = allUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // ===== 选择 =====
  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? pagedUsers.map((u) => u.id) : []);
  };

  // ===== 删除 =====
  const handleDelete = async (id: number) => {
    if (!confirm('Delete this user?')) return;
    await apiClient.delete(`/api/users/${id}`);
    setSelectedIds((prev) => prev.filter((i) => i !== id));
    fetchUsers();
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selectedIds.length} selected users?`)) return;
    // axios DELETE 带 body 要用 { data: ... } 语法
    await apiClient.delete('/api/users', { data: { ids: selectedIds } });
    setSelectedIds([]);
    fetchUsers();
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
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        selectedCount={selectedIds.length}
        onAdd={handleAdd}
        onBatchDelete={handleBatchDelete}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <UserTable
          users={pagedUsers}
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
          total={allUsers.length}
        />
      )}

      <UserFormDialog
        open={dialogOpen}
        user={editingUser}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchUsers}
      />
    </Box>
  );
}