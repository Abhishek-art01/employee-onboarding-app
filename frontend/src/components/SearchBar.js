/**
 * components/SearchBar.js — Debounced search input with filter chips.
 */
import React, { useState, useCallback } from 'react';
import { Box, TextField, InputAdornment, Chip, Stack } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

const STATUS_OPTIONS = ['draft','submitted','under_review','approved','rejected'];

export default function SearchBar({ onSearch, onFilter, placeholder = 'Search employees...' }) {
  const [value,         setValue]         = useState('');
  const [activeStatus,  setActiveStatus]  = useState('');

  const debounce = (fn, delay) => {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  };

  const debouncedSearch = useCallback(debounce((v) => onSearch?.(v), 400), []);

  const handleChange = (e) => {
    setValue(e.target.value);
    debouncedSearch(e.target.value);
  };

  const handleStatus = (status) => {
    const next = activeStatus === status ? '' : status;
    setActiveStatus(next);
    onFilter?.({ status: next });
  };

  return (
    <Box>
      <TextField fullWidth placeholder={placeholder} value={value} onChange={handleChange}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
        sx={{ mb: 1.5, background: '#fff' }} />
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Chip label="All" size="small" variant={!activeStatus ? 'filled' : 'outlined'}
          color="primary" onClick={() => handleStatus('')} />
        {STATUS_OPTIONS.map(s => (
          <Chip key={s} label={s.replace(/_/g,' ')} size="small"
            variant={activeStatus === s ? 'filled' : 'outlined'}
            color="primary" onClick={() => handleStatus(s)}
            sx={{ textTransform: 'capitalize' }} />
        ))}
      </Stack>
    </Box>
  );
}
