/**
 * components/Dashboard.js — Stats cards + recent activity for HR admins.
 */
import React, { useEffect, useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, Skeleton } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         PieChart, Pie, Cell, Legend } from 'recharts';
import { onboardingService } from '../services/onboardingService';

const COLORS = { draft:'#64b5f6', submitted:'#e8a020', under_review:'#7986cb',
                 approved:'#2a7a47', rejected:'#c0392b' };

const StatCard = ({ label, value, color, loading }) => (
  <Card>
    <CardContent>
      {loading
        ? <Skeleton variant="text" width="60%" height={48} />
        : <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>}
      <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
    </CardContent>
  </Card>
);

export default function DashboardStats() {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onboardingService.getDashStats()
      .then(res => setStats(res.stats))
      .finally(() => setLoading(false));
  }, []);

  const pieData  = stats ? Object.entries(COLORS).map(([name]) => ({
    name, value: parseInt(stats[name] || 0)
  })) : [];

  const barData  = stats ? [
    { name: 'Draft',        count: +stats.draft },
    { name: 'Submitted',    count: +stats.submitted },
    { name: 'Under Review', count: +stats.under_review },
    { name: 'Approved',     count: +stats.approved },
    { name: 'Rejected',     count: +stats.rejected },
  ] : [];

  return (
    <Box>
      <Grid container spacing={2} mb={3}>
        {[
          { label:'Total Applications', key:'total',        color:'text.primary' },
          { label:'Pending Review',      key:'submitted',    color:'warning.main' },
          { label:'Approved',            key:'approved',     color:'success.main' },
          { label:'This Week',           key:'this_week',    color:'primary.main' },
        ].map(s => (
          <Grid item xs={12} sm={6} md={3} key={s.key}>
            <StatCard label={s.label} value={stats?.[s.key] ?? '—'} color={s.color} loading={loading} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Applications by Status</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[4,4,0,0]}
                  fill="#2e6da4"
                  label={{ position: 'top', fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Status Distribution</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
