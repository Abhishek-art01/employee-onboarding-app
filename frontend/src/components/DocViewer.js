/**
 * components/DocViewer.js — Document list with download, verify actions.
 */
import React, { useState } from 'react';
import { Table, TableHead, TableBody, TableRow, TableCell, TableContainer,
         Paper, IconButton, Chip, Tooltip, Button, Typography, Box } from '@mui/material';
import DownloadIcon   from '@mui/icons-material/Download';
import VerifiedIcon   from '@mui/icons-material/Verified';
import CancelIcon     from '@mui/icons-material/Cancel';
import DeleteIcon     from '@mui/icons-material/Delete';
import { documentService } from '../services/documentService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = { pending:'warning', verified:'success', rejected:'error' };

export default function DocViewer({ documents = [], isHR = false, onRefresh }) {
  const [downloading, setDownloading] = useState({});

  const handleDownload = async (doc) => {
    setDownloading(p => ({ ...p, [doc.id]: true }));
    try {
      const res = await documentService.download(doc.id);
      window.open(res.url, '_blank');
    } catch {
      toast.error('Download failed.');
    } finally {
      setDownloading(p => ({ ...p, [doc.id]: false }));
    }
  };

  const handleVerify = async (id, status) => {
    const note = status === 'rejected' ? window.prompt('Rejection reason (optional):') : '';
    try {
      await documentService.verify(id, status, note);
      toast.success(`Document ${status}.`);
      onRefresh?.();
    } catch { toast.error('Action failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    try {
      await documentService.delete(id);
      toast.success('Document deleted.');
      onRefresh?.();
    } catch { toast.error('Delete failed.'); }
  };

  if (!documents.length)
    return <Typography color="text.secondary" textAlign="center" py={4}>No documents uploaded yet.</Typography>;

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow sx={{ background:'#f4f6f9' }}>
            {['Document Type','File Name','Size','Uploaded','Status', isHR ? 'Actions' : ''].map(h => (
              <TableCell key={h} sx={{ fontWeight:600 }}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map(doc => (
            <TableRow key={doc.id} hover>
              <TableCell><Chip label={doc.doc_type.replace(/_/g,' ')} size="small" /></TableCell>
              <TableCell sx={{ maxWidth: 160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {doc.original_name}
              </TableCell>
              <TableCell>{(doc.size_bytes/1024).toFixed(0)} KB</TableCell>
              <TableCell>{format(new Date(doc.created_at), 'dd MMM yyyy')}</TableCell>
              <TableCell>
                <Chip label={doc.verification_status} size="small"
                      color={STATUS_COLORS[doc.verification_status] || 'default'} />
              </TableCell>
              <TableCell>
                <Box sx={{ display:'flex', gap:0.5 }}>
                  <Tooltip title="Download">
                    <IconButton size="small" onClick={() => handleDownload(doc)} disabled={downloading[doc.id]}>
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {isHR && doc.verification_status === 'pending' && (<>
                    <Tooltip title="Verify">
                      <IconButton size="small" color="success" onClick={() => handleVerify(doc.id,'verified')}>
                        <VerifiedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Reject">
                      <IconButton size="small" color="error" onClick={() => handleVerify(doc.id,'rejected')}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </>)}
                  <Tooltip title="Delete">
                    <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
