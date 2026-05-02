/**
 * pages/Dashboard.js — Role-aware landing page.
 * Employees: see their onboarding status.
 * HR: see full stats + recent submissions.
 */
import React, { useEffect, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Button,
         LinearProgress, Avatar, Stack, Divider, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import Layout from '../components/Layout';
import DashboardStats from '../components/Dashboard';
import { onboardingService } from '../services/onboardingService';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon     from '@mui/icons-material/Folder';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon    from '@mui/icons-material/HourglassEmpty';
import toast from 'react-hot-toast';

const STATUS_META = {
  draft             : { color:'default',   label:'In Progress',    icon:<PendingIcon /> },
  submitted         : { color:'warning',   label:'Submitted',      icon:<PendingIcon /> },
  under_review      : { color:'info',      label:'Under Review',   icon:<PendingIcon /> },
  requires_correction:{ color:'error',     label:'Needs Correction',icon:<PendingIcon /> },
  approved          : { color:'success',   label:'Approved',       icon:<CheckCircleIcon /> },
  rejected          : { color:'error',     label:'Rejected',       icon:<PendingIcon /> },
};

const STEP_LABELS = {
  personal:'Personal Info', education:'Education', employment:'Employment History',
  bank:'Bank Details', emergency:'Emergency Contact', consent:'Consent & Submit'
};

// ── Employee progress card ────────────────────────────────────────
function EmployeeView() {
  const navigate = useNavigate();
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    onboardingService.getMyForm()
      .then(res => setForm(res.form))
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    try {
      if (!form) await onboardingService.createForm();
      navigate('/onboarding');
    } catch(err) { toast.error(err.message || 'Could not start form.'); }
  };

  const completedSteps = form ? Object.keys(form.form_data || {}) : [];
  const totalSteps     = 6;
  const progress       = Math.round((completedSteps.length / totalSteps) * 100);
  const meta           = STATUS_META[form?.status] || STATUS_META.draft;

  return (
    <Grid container spacing={3}>
      {/* Welcome card */}
      <Grid item xs={12}>
        <Card sx={{ background:'linear-gradient(135deg,#1a3660,#2e6da4)', color:'white', p:1 }}>
          <CardContent>
            <Typography variant="h5" fontWeight={700} mb={0.5}>
              Welcome to Employee Onboarding 👋
            </Typography>
            <Typography variant="body2" sx={{ opacity:0.85 }}>
              Complete your onboarding form to get started. Our HR team will review your submission within 2–3 business days.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Onboarding status */}
      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
              <Typography variant="h6">Onboarding Progress</Typography>
              {form && <Chip label={meta.label} color={meta.color} size="small" icon={meta.icon} />}
            </Box>

            {loading ? <LinearProgress /> : (
              <>
                {form?.status === 'requires_correction' && (
                  <Alert severity="warning" sx={{ mb:2 }}>
                    <strong>Action Required:</strong> {form.reviewer_note || 'Please review and correct your form.'}
                  </Alert>
                )}
                {form?.status === 'approved' && (
                  <Alert severity="success" sx={{ mb:2 }}>
                    🎉 Your onboarding has been approved! Welcome to the team.
                  </Alert>
                )}

                <Box sx={{ mb:2 }}>
                  <Box sx={{ display:'flex', justifyContent:'space-between', mb:0.5 }}>
                    <Typography variant="body2" color="text.secondary">Completion</Typography>
                    <Typography variant="body2" fontWeight={600}>{progress}%</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={progress}
                    sx={{ height:10, borderRadius:5, '& .MuiLinearProgress-bar':{ borderRadius:5 } }} />
                </Box>

                <Stack spacing={1}>
                  {Object.entries(STEP_LABELS).map(([key, label]) => {
                    const done = completedSteps.includes(key);
                    return (
                      <Box key={key} sx={{ display:'flex', alignItems:'center', gap:1 }}>
                        <CheckCircleIcon sx={{ fontSize:18, color: done ? 'success.main' : 'grey.300' }} />
                        <Typography variant="body2" color={done ? 'text.primary' : 'text.secondary'}>
                          {label}
                        </Typography>
                        {done && <Chip label="Done" size="small" color="success" sx={{ ml:'auto', height:20 }} />}
                      </Box>
                    );
                  })}
                </Stack>

                <Button variant="contained" fullWidth sx={{ mt:3 }} onClick={handleStart}
                  disabled={form?.status === 'approved'}>
                  {!form ? 'Start Onboarding' : form.status === 'approved' ? '✓ Onboarding Complete' : 'Continue Form →'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Quick links */}
      <Grid item xs={12} md={5}>
        <Stack spacing={2}>
          <Card sx={{ cursor:'pointer', '&:hover':{ boxShadow:4 } }} onClick={() => navigate('/documents')}>
            <CardContent sx={{ display:'flex', gap:2, alignItems:'center' }}>
              <Avatar sx={{ bgcolor:'primary.light' }}><FolderIcon /></Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>Upload Documents</Typography>
                <Typography variant="body2" color="text.secondary">
                  Upload Aadhaar, PAN, degree certificates and more
                </Typography>
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ cursor:'pointer', '&:hover':{ boxShadow:4 } }} onClick={() => navigate('/onboarding')}>
            <CardContent sx={{ display:'flex', gap:2, alignItems:'center' }}>
              <Avatar sx={{ bgcolor:'secondary.main' }}><AssignmentIcon /></Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>Onboarding Form</Typography>
                <Typography variant="body2" color="text.secondary">
                  Fill personal, education, bank and employment details
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Stack>
      </Grid>
    </Grid>
  );
}

// ── HR / Admin view ───────────────────────────────────────────────
function HRView() {
  const navigate = useNavigate();
  const [recentForms, setRecentForms] = useState([]);

  useEffect(() => {
    onboardingService.getAllForms({ limit:5, page:1 })
      .then(res => setRecentForms(res.forms || []))
      .catch(() => {});
  }, []);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h5" fontWeight={700}>HR Dashboard</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Overview of all employee onboarding applications
        </Typography>
      </Grid>
      <Grid item xs={12}>
        <DashboardStats />
      </Grid>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:2 }}>
              <Typography variant="h6">Recent Submissions</Typography>
              <Button size="small" onClick={() => navigate('/admin/review')}>View All →</Button>
            </Box>
            <Stack divider={<Divider />} spacing={0}>
              {recentForms.length === 0
                ? <Typography color="text.secondary" py={2} textAlign="center">No submissions yet.</Typography>
                : recentForms.map(form => {
                    const meta = STATUS_META[form.status] || STATUS_META.draft;
                    return (
                      <Box key={form.id} sx={{ display:'flex', justifyContent:'space-between',
                        alignItems:'center', py:1.5, cursor:'pointer', '&:hover':{ bgcolor:'#f9f9f9' } }}
                        onClick={() => navigate('/admin/review')}>
                        <Box sx={{ display:'flex', gap:1.5, alignItems:'center' }}>
                          <Avatar sx={{ width:34, height:34, bgcolor:'primary.main', fontSize:14 }}>
                            {form.full_name?.[0]}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{form.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary">{form.email}</Typography>
                          </Box>
                        </Box>
                        <Chip label={meta.label} color={meta.color} size="small" />
                      </Box>
                    );
                  })
              }
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuth();
  const isHR     = ['hr_admin','hr_executive','super_admin'].includes(user?.role);
  return (
    <Layout>
      <Box sx={{ maxWidth:1100, mx:'auto' }}>
        {isHR ? <HRView /> : <EmployeeView />}
      </Box>
    </Layout>
  );
}
