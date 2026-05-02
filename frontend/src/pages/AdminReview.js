/**
 * pages/AdminReview.js — HR review queue: list + approve/reject modal.
 */
import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Table, TableHead, TableBody, TableRow,
         TableCell, TableContainer, Chip, Button, TextField, Dialog, DialogTitle,
         DialogContent, DialogActions, Avatar, Stack, Tooltip, Grid, MenuItem,
         FormControl, InputLabel, Select, Pagination } from '@mui/material';
import { format } from 'date-fns';
import toast    from 'react-hot-toast';
import Layout   from '../components/Layout';
import SearchBar from '../components/SearchBar';
import DocViewer from '../components/DocViewer';
import { onboardingService } from '../services/onboardingService';
import { documentService }   from '../services/documentService';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon      from '@mui/icons-material/Cancel';
import VisibilityIcon  from '@mui/icons-material/Visibility';
import RateReviewIcon  from '@mui/icons-material/RateReview';

const STATUS_COLOR = { draft:'default', submitted:'warning', under_review:'info',
  requires_correction:'error', approved:'success', rejected:'error' };

function ReviewDialog({ form, open, onClose, onDone }) {
  const [status, setStatus]   = useState('');
  const [note,   setNote]     = useState('');
  const [docs,   setDocs]     = useState([]);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    if (form?.user_id) {
      documentService.listUserDocs(form.user_id)
        .then(res => setDocs(res.documents || []))
        .catch(() => {});
    }
  }, [form]);

  const handleSubmit = async () => {
    if (!status) { toast.error('Select a decision.'); return; }
    setSaving(true);
    try {
      await onboardingService.reviewForm(form.id, { status, reviewerNote: note });
      toast.success(`Form ${status}.`);
      onDone();
    } catch(err) { toast.error(err.message || 'Action failed.'); }
    finally { setSaving(false); }
  };

  const fd = form?.form_data || {};

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor:'primary.main', color:'white' }}>
        Review Application — {form?.full_name}
        <Typography variant="caption" display="block" sx={{ opacity:0.8 }}>
          {form?.email} · Submitted {form?.submitted_at ? format(new Date(form.submitted_at),'dd MMM yyyy') : 'Not yet'}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ p:2 }}>
        <Grid container spacing={2}>
          {/* Personal */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={700} mb={1} color="primary">Personal Details</Typography>
            {[
              ['Name',     `${fd.personal?.firstName || ''} ${fd.personal?.lastName || ''}`],
              ['DOB',      fd.personal?.dob || '—'],
              ['Gender',   fd.personal?.gender || '—'],
              ['Mobile',   fd.personal?.mobile || '—'],
              ['Aadhaar',  fd.personal?.aadhaarVerified ? '✓ Verified' : 'Not verified'],
              ['PAN',      fd.personal?.panVerified     ? '✓ Verified' : 'Not verified'],
            ].map(([k,v]) => (
              <Box key={k} sx={{ display:'flex', justifyContent:'space-between', py:0.4, borderBottom:'1px solid #f0f0f0' }}>
                <Typography variant="body2" color="text.secondary">{k}</Typography>
                <Typography variant="body2" fontWeight={500}>{v}</Typography>
              </Box>
            ))}
          </Grid>
          {/* Employment */}
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" fontWeight={700} mb={1} color="primary">Employment Details</Typography>
            {[
              ['Designation',  fd.employment?.designation || '—'],
              ['Department',   fd.employment?.department  || '—'],
              ['Joining Date', fd.employment?.joiningDate || '—'],
              ['Type',         fd.employment?.employmentType || '—'],
              ['Prev Employer',fd.employment?.prevEmployer || 'Fresher'],
              ['Bank Verified',fd.bank?.bankVerified ? '✓ Verified' : 'Not verified'],
            ].map(([k,v]) => (
              <Box key={k} sx={{ display:'flex', justifyContent:'space-between', py:0.4, borderBottom:'1px solid #f0f0f0' }}>
                <Typography variant="body2" color="text.secondary">{k}</Typography>
                <Typography variant="body2" fontWeight={500}>{v}</Typography>
              </Box>
            ))}
          </Grid>
          {/* Documents */}
          <Grid item xs={12}>
            <Typography variant="subtitle2" fontWeight={700} mb={1} color="primary">Documents ({docs.length})</Typography>
            <DocViewer documents={docs} isHR onRefresh={() => {}} />
          </Grid>
          {/* Decision */}
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth>
              <InputLabel>Decision</InputLabel>
              <Select value={status} label="Decision" onChange={e => setStatus(e.target.value)}>
                <MenuItem value="approved">✅ Approve</MenuItem>
                <MenuItem value="rejected">❌ Reject</MenuItem>
                <MenuItem value="under_review">🔍 Mark Under Review</MenuItem>
                <MenuItem value="requires_correction">⚠️ Request Correction</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={7}>
            <TextField fullWidth multiline rows={2} label="Reviewer Note (optional)"
              value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Document X unclear, please re-upload." />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px:3, py:2 }}>
        <Button onClick={onClose} variant="outlined">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving || !status}>
          {saving ? 'Saving...' : 'Submit Decision'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AdminReviewPage() {
  const [forms,     setForms]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filters,   setFilters]   = useState({ status:'', page:1 });
  const [totalPages,setTotalPages]= useState(1);
  const [selected,  setSelected]  = useState(null);
  const [dialogOpen,setDialogOpen]= useState(false);

  const loadForms = () => {
    setLoading(true);
    onboardingService.getAllForms({ status: filters.status, page: filters.page, limit: 15 })
      .then(res => { setForms(res.forms || []); setTotalPages(Math.ceil(res.count / 15) || 1); })
      .catch(() => toast.error('Failed to load forms.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadForms(); }, [filters]);

  const handleReview = (form) => { setSelected(form); setDialogOpen(true); };

  return (
    <Layout>
      <Box sx={{ maxWidth:1200, mx:'auto' }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>HR Review Queue</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Review, approve, or request corrections for employee onboarding applications.
        </Typography>

        <Card sx={{ mb:2 }}>
          <CardContent>
            <SearchBar
              placeholder="Search by name, email..."
              onFilter={f => setFilters(p => ({ ...p, status: f.status, page:1 }))} />
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p:0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor:'#f4f6f9' }}>
                    {['Employee','Email','Department','Submitted','Status','Actions'].map(h => (
                      <TableCell key={h} sx={{ fontWeight:700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading
                    ? <TableRow><TableCell colSpan={6} align="center" sx={{ py:4 }}>Loading...</TableCell></TableRow>
                    : forms.length === 0
                      ? <TableRow><TableCell colSpan={6} align="center" sx={{ py:4, color:'text.secondary' }}>
                          No applications found.
                        </TableCell></TableRow>
                      : forms.map(form => (
                          <TableRow key={form.id} hover>
                            <TableCell>
                              <Box sx={{ display:'flex', gap:1.5, alignItems:'center' }}>
                                <Avatar sx={{ width:32, height:32, bgcolor:'primary.main', fontSize:13 }}>
                                  {form.full_name?.[0]}
                                </Avatar>
                                <Typography variant="body2" fontWeight={500}>{form.full_name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell><Typography variant="body2">{form.email}</Typography></TableCell>
                            <TableCell><Typography variant="body2">{form.department || '—'}</Typography></TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {form.submitted_at ? format(new Date(form.submitted_at),'dd MMM yyyy') : 'Not submitted'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip label={form.status.replace(/_/g,' ')} size="small"
                                color={STATUS_COLOR[form.status] || 'default'} sx={{ textTransform:'capitalize' }} />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Review Application">
                                <Button size="small" variant="outlined" startIcon={<RateReviewIcon />}
                                  onClick={() => handleReview(form)}>Review</Button>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                  }
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display:'flex', justifyContent:'center', py:2 }}>
              <Pagination count={totalPages} page={filters.page} color="primary"
                onChange={(_,p) => setFilters(f => ({ ...f, page:p }))} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {selected && (
        <ReviewDialog form={selected} open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onDone={() => { setDialogOpen(false); loadForms(); }} />
      )}
    </Layout>
  );
}
