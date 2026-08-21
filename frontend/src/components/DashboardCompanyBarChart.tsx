'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Alert, Box, Button, Card, Checkbox, Chip, CircularProgress, Divider, FormControl,
  IconButton, InputLabel, ListItemText, MenuItem, MenuList, Paper, Popover, Select, Slider,
  Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import apiClient from '@/lib/api-client';
import type { BarChartDimension, BarChartFilters, BarChartOptions, BarChartResult } from '@/types/api';
import DashboardCompanyBubbleChart from './DashboardCompanyBubbleChart';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const EMPTY_FILTERS: BarChartFilters = {
  level: [], country: [], city: [], founded_year: {}, annual_revenue: {}, employees: {},
};
const DIMENSIONS: Array<{ value: BarChartDimension; label: string }> = [
  { value: 'level', label: 'Company level' },
  { value: 'country', label: 'Country' },
  { value: 'city', label: 'City' },
];

function MultiFilter({ label, value, options, onChange }: {
  label: string;
  value: Array<string | number>;
  options: Array<string | number>;
  onChange: (value: Array<string | number>) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState('');
  const visibleOptions = options.filter((item) => String(item).toLowerCase().includes(search.toLowerCase()));
  const toggle = (item: string | number) => onChange(value.includes(item) ? value.filter((selected) => selected !== item) : [...value, item]);
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.75, color: '#111' }}>{label}</Typography>
      <Paper variant="outlined" sx={{ minHeight: 57, px: 1.25, display: 'flex', alignItems: 'center', gap: 0.75, borderRadius: 0, bgcolor: '#fff' }}>
        <Box onClick={(event) => setAnchorEl(event.currentTarget.parentElement)} sx={{ minWidth: 0, flex: 1, display: 'flex', gap: 0.75, alignItems: 'center', overflow: 'hidden', cursor: 'pointer' }}>
          {value.length ? value.map((item, index) => <Chip key={item} size="small" label={`${String(item).toUpperCase()} ×`} sx={{ flexShrink: 0, bgcolor: '#eef1f7', '&::before': { content: '""', width: 9, height: 9, borderRadius: '50%', bgcolor: ['#f6538b', '#6750c9', '#008a78', '#2385c7'][index % 4], ml: 1 } }} />) : <Typography color="text.secondary">Select</Typography>}
        </Box>
        <IconButton aria-label={`Add ${label}`} size="small" onClick={(event) => setAnchorEl(event.currentTarget.parentElement)} sx={{ width: 25, height: 30, border: '1px solid #d5d9df', borderRadius: 0 }}><AddIcon sx={{ fontSize: 15 }} /></IconButton>
        <IconButton aria-label={`Search ${label}`} onClick={(event) => setAnchorEl(event.currentTarget.parentElement)}><SearchIcon sx={{ color: '#344054' }} /></IconButton>
      </Paper>
      <Popover open={Boolean(anchorEl)} anchorEl={anchorEl} onClose={() => { setAnchorEl(null); setSearch(''); }} anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'left' }} slotProps={{ paper: { sx: { width: anchorEl?.clientWidth, maxHeight: 340, borderRadius: 0 } } }}>
        <Box sx={{ p: 1 }}><TextField autoFocus size="small" fullWidth placeholder={`Search ${label.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ input: { startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> } }} /></Box>
        <MenuList disablePadding>
          <MenuItem onClick={() => onChange(value.length === options.length ? [] : [...options])}><Checkbox checked={value.length === options.length} indeterminate={value.length > 0 && value.length < options.length} /><ListItemText primary="Select All" /></MenuItem>
          <Typography variant="subtitle2" sx={{ px: 1.5, pt: 1.5, pb: 0.75, fontWeight: 700 }}>{label.toUpperCase()} OPTIONS</Typography>
          <Divider sx={{ mx: 1 }} />
          <Box sx={{ maxHeight: 210, overflowY: 'auto' }}>
            {visibleOptions.map((item) => <MenuItem key={item} onClick={() => toggle(item)}><Checkbox checked={value.includes(item)} /><ListItemText primary={String(item)} /></MenuItem>)}
            {!visibleOptions.length && <Typography color="text.secondary" sx={{ p: 2 }}>No matching options</Typography>}
          </Box>
        </MenuList>
      </Popover>
    </Box>
  );
}

function RangeFilter({ label, min, max, start, end, onChange }: {
  label: string; min: number; max: number; start?: number; end?: number;
  onChange: (start?: number, end?: number) => void;
}) {
  const [localValue, setLocalValue] = useState<number[]>([start ?? min, end ?? max]);
  const format = (value: number) => label === 'Annual revenue'
    ? new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value)
    : value.toLocaleString();
  const commit = (value: number | number[]) => {
    const [nextStart, nextEnd] = value as number[];
    onChange(nextStart === min ? undefined : nextStart, nextEnd === max ? undefined : nextEnd);
  };
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ color: '#111' }}>{label}</Typography>
      <Slider
        aria-label={`${label} range`}
        value={localValue}
        min={min}
        max={max}
        step={1}
        disableSwap
        valueLabelDisplay="auto"
        valueLabelFormat={format}
        onChange={(_, value) => setLocalValue(value as number[])}
        onChangeCommitted={(_, value) => commit(value)}
        sx={{ mt: 1, mb: 0, color: '#0071bc', '& .MuiSlider-thumb': { width: 14, height: 14, bgcolor: '#fff', border: '2px solid currentColor' } }}
      />
      <Stack direction="row" sx={{ justifyContent: 'space-between', mt: -0.5 }}>
        <Typography variant="caption">{format(localValue[0])}</Typography>
        <Typography variant="caption">{format(localValue[1])}</Typography>
      </Stack>
    </Box>
  );
}

function activeFilterCount(filters: BarChartFilters) {
  return [filters.level.length, filters.country.length, filters.city.length,
    filters.founded_year.start, filters.founded_year.end, filters.annual_revenue.min,
    filters.annual_revenue.max, filters.employees.min, filters.employees.max]
    .filter((value) => value !== undefined && value !== 0).length;
}

export default function DashboardCompanyBarChart() {
  const [view, setView] = useState<'bar' | 'bubble'>('bar');
  const [dimension, setDimension] = useState<BarChartDimension>('level');
  const [filters, setFilters] = useState<BarChartFilters>(EMPTY_FILTERS);
  const [options, setOptions] = useState<BarChartOptions | null>(null);
  const [result, setResult] = useState<BarChartResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadChart = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.post<BarChartResult>('/api/dashboard/barchart', { dimension, filter: filters });
      setResult(response.data);
    } catch {
      setError('Unable to load results. Review the selected ranges and try again.');
    } finally {
      setLoading(false);
    }
  }, [dimension, filters]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiClient.get<BarChartOptions>('/api/dashboard/barchart/options');
        setOptions(response.data);
      } catch { setError('Unable to load filter options.'); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (view !== 'bar') return;
    const timer = window.setTimeout(() => void loadChart(), 250);
    return () => window.clearTimeout(timer);
  }, [loadChart, view]);

  const filterCount = activeFilterCount(filters);
  const summary = useMemo(() => {
    const values: string[] = [];
    if (filters.level.length) values.push(`Level ${filters.level.join(', ')}`);
    if (filters.country.length) values.push(filters.country.join(', '));
    if (filters.city.length) values.push(filters.city.join(', '));
    if (filters.founded_year.start !== undefined || filters.founded_year.end !== undefined) {
      values.push(`Founded ${filters.founded_year.start ?? options?.ranges.foundedYear.min ?? 'Any'}–${filters.founded_year.end ?? options?.ranges.foundedYear.max ?? 'Any'}`);
    }
    if (filters.annual_revenue.min !== undefined || filters.annual_revenue.max !== undefined) values.push('Revenue range applied');
    if (filters.employees.min !== undefined || filters.employees.max !== undefined) values.push('Employee range applied');
    return values;
  }, [filters, options]);

  const chartData = {
    labels: result?.data.map((item) => dimension === 'level' ? `Level ${item.label}` : item.label) ?? [],
    datasets: [{ data: result?.data.map((item) => item.count) ?? [], backgroundColor: '#0071bc', hoverBackgroundColor: '#004c92', borderRadius: 2, maxBarThickness: 54 }],
  };
  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 350 },
    plugins: { legend: { display: false }, tooltip: { displayColors: false, backgroundColor: '#172b4d', padding: 12,
      callbacks: { title: (items: Array<{ label: string }>) => items[0]?.label ?? '', label: (context: { dataIndex: number }) => {
        const item = result?.data[context.dataIndex];
        return item ? [`${item.count.toLocaleString()} companies`, `${item.percentage.toFixed(1)}% of filtered total`] : [];
      } } } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Number of companies', color: '#5d6b7a' }, grid: { color: '#e6e9ed' }, border: { display: false }, ticks: { precision: 0, color: '#5d6b7a' } },
      x: { title: { display: true, text: DIMENSIONS.find((item) => item.value === dimension)?.label, color: '#5d6b7a' }, grid: { display: false }, border: { color: '#aeb7c2' }, ticks: { autoSkip: false, maxRotation: 45, minRotation: 0, color: '#344054' } },
    },
  };

  return (
    <Box sx={{ mt: 4, mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 }, py: { xs: 3, md: 5 }, bgcolor: '#edf1f7' }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(320px, 1fr)' }, gap: 3, alignItems: 'start' }}>
        <Card sx={{ p: { xs: 2, md: 2.5 }, minWidth: 0, borderRadius: 1, boxShadow: '0 1px 6px rgba(15, 40, 70, .18)' }}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#111' }}>{view === 'bar' ? `Companies by ${DIMENSIONS.find((item) => item.value === dimension)?.label.toLowerCase()}` : 'Company hierarchy'}</Typography>
              <Typography variant="body2" sx={{ mt: 1, color: '#344054' }}>{view === 'bar' && result ? `${result.total.toLocaleString()} companies · ` : ''}{summary.length ? summary.join(' · ') : 'All available company records'}</Typography>
            </Box>
            <IconButton size="small" aria-label="Chart menu"><MenuIcon /></IconButton>
          </Stack>
          {view === 'bar' ? <>
            {error && <Alert sx={{ mt: 2 }} severity="error" action={<Button color="inherit" onClick={() => void loadChart()}>Retry</Button>}>{error}</Alert>}
            {loading ? <Box sx={{ height: 480, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
              : result?.data.length ? <Box sx={{ height: 500, mt: 3, overflowX: 'auto' }}><Box sx={{ height: '100%', minWidth: Math.max(620, result.data.length * 58) }}><Bar data={chartData} options={chartOptions} /></Box></Box>
                : <Alert sx={{ mt: 3 }} severity="info">No companies match the selected filters.</Alert>}
          </> : <DashboardCompanyBubbleChart filters={filters} />}
          {summary.length > 0 && <Stack direction="row" spacing={0.75} useFlexGap sx={{ mt: 2, flexWrap: 'wrap' }}>{summary.map((item) => <Chip key={item} label={item} size="small" />)}</Stack>}
          <Typography variant="body2" sx={{ mt: 3, lineHeight: 1.55 }}><strong>Note:</strong> {view === 'bar' ? 'Bars show the number of companies in each selected dimension. Hover over a bar to view its count and share.' : 'Circle size represents the number of companies in a branch. Click a parent bubble to zoom in; click the background or a non-zoomable leaf area to return to the overview.'} All filters are combined.</Typography>
          <Typography variant="caption" color="text.secondary">Source: Company supply-chain database</Typography>
        </Card>

        <Box sx={{ minWidth: 0 }}>
          <Tabs value={view} onChange={(_, value: 'bar' | 'bubble') => setView(value)} sx={{ minHeight: 45, borderBottom: '1px solid #c5cbd3', '& .MuiTab-root': { minHeight: 45, color: '#111', textTransform: 'none' } }}>
            <Tab value="bar" label="Bar chart" /><Tab value="bubble" label="Bubble hierarchy" />
          </Tabs>
          <Button sx={{ mt: 2, mb: 2, bgcolor: '#fff', borderRadius: 0 }} startIcon={<RestartAltIcon />} disabled={!filterCount} onClick={() => setFilters(EMPTY_FILTERS)}>Reset Filters {filterCount ? `(${filterCount})` : ''}</Button>
          <FilterPanel showDimension={view === 'bar'} dimension={dimension} setDimension={setDimension} filters={filters} setFilters={setFilters} options={options} />
        </Box>
      </Box>
    </Box>
  );
}

function FilterPanel({ showDimension, dimension, setDimension, filters, setFilters, options }: {
  showDimension: boolean;
  dimension: BarChartDimension; setDimension: (value: BarChartDimension) => void;
  filters: BarChartFilters; setFilters: (value: BarChartFilters) => void; options: BarChartOptions | null;
}) {
  return (
    <Stack spacing={2}>
      {showDimension && <Box><Typography variant="subtitle2" sx={{ mb: 0.75, color: '#111' }}>X-axis dimension</Typography><FormControl size="small" fullWidth sx={{ bgcolor: '#fff' }}><InputLabel>Select dimension</InputLabel><Select value={dimension} label="Select dimension" onChange={(event) => setDimension(event.target.value as BarChartDimension)}>{DIMENSIONS.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</Select></FormControl></Box>}
      {showDimension && <Divider />}
      {options ? <>
        <MultiFilter label="Company level" value={filters.level} options={options.levels} onChange={(value) => setFilters({ ...filters, level: value.map(Number) })} />
        <MultiFilter label="Country" value={filters.country} options={options.countries} onChange={(value) => setFilters({ ...filters, country: value.map(String) })} />
        <MultiFilter label="City" value={filters.city} options={options.cities} onChange={(value) => setFilters({ ...filters, city: value.map(String) })} />
        <RangeFilter key={`year-${filters.founded_year.start}-${filters.founded_year.end}`} label="Joined supply chain (year)" min={options.ranges.foundedYear.min} max={options.ranges.foundedYear.max} start={filters.founded_year.start} end={filters.founded_year.end} onChange={(start, end) => setFilters({ ...filters, founded_year: { start, end } })} />
        <RangeFilter key={`revenue-${filters.annual_revenue.min}-${filters.annual_revenue.max}`} label="Annual revenue" min={options.ranges.annualRevenue.min} max={options.ranges.annualRevenue.max} start={filters.annual_revenue.min} end={filters.annual_revenue.max} onChange={(min, max) => setFilters({ ...filters, annual_revenue: { min, max } })} />
        <RangeFilter key={`employees-${filters.employees.min}-${filters.employees.max}`} label="Employees" min={options.ranges.employees.min} max={options.ranges.employees.max} start={filters.employees.min} end={filters.employees.max} onChange={(min, max) => setFilters({ ...filters, employees: { min, max } })} />
      </> : <Box sx={{ display: 'grid', placeItems: 'center', py: 4 }}><CircularProgress size={24} /></Box>}
    </Stack>
  );
}
