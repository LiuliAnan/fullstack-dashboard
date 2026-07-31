'use client';

import {
  TextField,
  Box,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormControl,
} from '@mui/material';

import { COMPANY_LEVELS } from '@/lib/constants';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  levelFilter: number[];
  onLevelFilterChange: (value: number[]) => void;
}

export default function CompanyToolbar({
  search,
  onSearchChange,
  levelFilter,
  onLevelFilterChange,
}: Props) {
  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
      {/* 搜索框（按公司名）*/}
      <TextField
        label="Search by company name"
        size="small"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        sx={{ minWidth: 260 }}
      />

      {/* level 多选过滤 */}
      <FormControl size="small" sx={{ minWidth: 220 }}>
        <Select
          multiple
          value={levelFilter}
          onChange={(e) => {
            const val = e.target.value;
            // Select multiple 的 value 可能是 number[] 或 string（单选时）
            onLevelFilterChange(
              typeof val === 'string'
                ? val.split(',').map(Number)
                : val,
            );
          }}
          input={<OutlinedInput label="Filter by level" />}
          renderValue={(selected) =>
            (selected as number[])
              .map((v) => <Chip key={v} label={`Level ${v}`} size="small" sx={{ mr: 0.5 }} />)
          }
          displayEmpty
        >
          {COMPANY_LEVELS.map((l) => (
            <MenuItem key={l} value={l}>
              Level {l}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}