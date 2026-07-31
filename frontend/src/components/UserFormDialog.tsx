'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
} from '@mui/material';
import apiClient from '@/lib/api-client';
import { USER_ROLES, USER_STATUSES } from '@/lib/constants';
import type { UserListItem, CreateUserDto } from '@/types/api';

interface Props {
  open: boolean;
  user: UserListItem | null; // null = 添加模式，有值 = 编辑模式
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserFormDialog({ open, user, onClose, onSuccess }: Props) {
  const [form, setForm] = useState<CreateUserDto>({
    name: '',
    email: '',
    password: '',
    role: 'User',
    status: 'active',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEdit = !!user;

  // 对话框打开时，填充表单（编辑模式填入现有数据）
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name,
        email: user.email,
        password: '', // 编辑时密码留空，不填则不改
        role: user.role,
        status: user.status,
      });
    } else {
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'User',
        status: 'active',
      });
    }
    setError('');
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEdit) {
        // 编辑：不传空密码（避免把密码改成空）
        const payload: Record<string, string> = {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        };
        if (form.password) payload.password = form.password;
        await apiClient.patch(`/api/users/${user!.id}`, payload);
      } else {
        // 添加
        await apiClient.post('/api/users', form);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      const message = err.response?.data?.message;
      setError(Array.isArray(message) ? message[0] : message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit User' : 'Add User'}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>
          )}
          <Stack spacing={2}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label={isEdit ? 'Password (leave blank to keep)' : 'Password'}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!isEdit}
              fullWidth
            />
            <TextField
              select
              label="Role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              fullWidth
            >
              {USER_ROLES.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              fullWidth
            >
              {USER_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}