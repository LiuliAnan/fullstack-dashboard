'use client';

import {
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormControl,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { USER_ROLES } from '@/lib/constants';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  roleFilter: string[];
  onRoleFilterChange: (value: string[]) => void;
  selectedCount: number;
  onAdd: () => void;
  onBatchDelete: () => void;
}

export default function UserToolbar({
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  selectedCount,
  onAdd,
  onBatchDelete,
}: Props) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* 搜索框（按姓名）*/}
      <TextField
        label="Search by name"
        size="small"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 220 }}
      />

      {/* role 多选过滤 */}
      <FormControl size="small" sx={{ minWidth: 260 }}>
        <Select
          multiple
          value={roleFilter}
          onChange={(e) => {
            const val = e.target.value;
            onRoleFilterChange(typeof val === 'string' ? val.split(',') : val);
          }}
          input={<OutlinedInput label="Filter by role" />}
          renderValue={(selected) =>
            (selected as string[])
              .map((v) => <Chip key={v} label={v} size="small" sx={{ mr: 0.5 }} />)
          }
          displayEmpty
        >
          {USER_ROLES.map((r) => (
            <MenuItem key={r} value={r}>
              {r}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box sx={{ flexGrow: 1 }} />

      {/* 批量删除（选中后才显示）*/}
      {selectedCount > 0 && (
        <Button
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={onBatchDelete}
        >
          Delete Selected ({selectedCount})
        </Button>
      )}

      {/* 添加用户 */}
      <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
        Add User
      </Button>
    </Box>
  );
}