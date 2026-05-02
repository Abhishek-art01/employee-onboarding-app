import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight:'100vh', display:'flex', flexDirection:'column',
               alignItems:'center', justifyContent:'center', gap:2, bgcolor:'background.default' }}>
      <Typography variant="h1" fontWeight={800} color="primary.main" sx={{ fontSize:'6rem' }}>404</Typography>
      <Typography variant="h5" color="text.secondary">Page not found</Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>← Back to Dashboard</Button>
    </Box>
  );
}
