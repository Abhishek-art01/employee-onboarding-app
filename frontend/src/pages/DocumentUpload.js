/**
 * pages/DocumentUpload.js — Drag-and-drop uploader + document list.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Card, CardContent, MenuItem, FormControl,
         InputLabel, Select, Button, LinearProgress, Alert, Chip, Grid } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import UploadFileIcon  from '@mui/icons-material/UploadFile';
import toast           from 'react-hot-toast';
import Layout          from '../components/Layout';
import DocViewer       from '../components/DocViewer';
import { documentService } from '../services/documentService';
import { useAuth }         from '../App';

const DOC_TYPES = [
  { value:'aadhaar_front',       label:'Aadhaar Card (Front)' },
  { value:'aadhaar_back',        label:'Aadhaar Card (Back)' },
  { value:'pan_card',            label:'PAN Card' },
  { value:'passport',            label:'Passport' },
  { value:'degree_certificate',  label:'Degree Certificate' },
  { value:'experience_letter',   label:'Experience Letter' },
  { value:'offer_letter',        label:'Offer Letter (Previous)' },
  { value:'bank_passbook',       label:'Bank Passbook / Cancelled Cheque' },
  { value:'photo',               label:'Passport Size Photo' },
  { value:'other',               label:'Other Document' },
];

function DropZone({ onDrop, file }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(accepted => onDrop(accepted[0]), [onDrop]),
    accept : { 'application/pdf':[], 'image/*':[] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  return (
    <Box {...getRootProps()} sx={{
      border       : `2px dashed ${isDragActive ? '#2e6da4' : '#c0cfe0'}`,
      borderRadius : 2,
      p            : 4,
      textAlign    : 'center',
      cursor       : 'pointer',
      bgcolor      : isDragActive ? '#e8f4fd' : '#f8fafc',
      transition   : 'all 0.2s',
      '&:hover'    : { borderColor:'#2e6da4', bgcolor:'#e8f4fd' },
    }}>
      <input {...getInputProps()} />
      <UploadFileIcon sx={{ fontSize:48, color: file ? 'success.main' : 'primary.light', mb:1 }} />
      {file
        ? <><Typography variant="body1" fontWeight={600} color="success.main">{file.name}</Typography>
            <Typography variant="caption" color="text.secondary">{(file.size/1024).toFixed(1)} KB</Typography></>
        : <><Typography variant="body1" fontWeight={500}>
            {isDragActive ? 'Drop the file here...' : 'Drag & drop a file here, or click to select'}
          </Typography>
          <Typography variant="caption" color="text.secondary">PDF, JPEG, PNG — max 10 MB</Typography></>
      }
    </Box>
  );
}

export default function DocumentUploadPage() {
  const { user }   = useAuth();
  const [docs,     setDocs]     = useState([]);
  const [file,     setFile]     = useState(null);
  const [docType,  setDocType]  = useState('');
  const [progress, setProgress] = useState(0);
  const [uploading,setUploading]= useState(false);
  const [error,    setError]    = useState('');
  const isHR = ['hr_admin','hr_executive','super_admin'].includes(user?.role);

  const loadDocs = () => {
    documentService.listMyDocs()
      .then(res => setDocs(res.documents || []))
      .catch(() => {});
  };

  useEffect(() => { loadDocs(); }, []);

  const handleUpload = async () => {
    setError('');
    if (!file)    { setError('Please select a file.'); return; }
    if (!docType) { setError('Please select a document type.'); return; }

    setUploading(true);
    setProgress(20);

    try {
      setProgress(60);
      await documentService.upload(file, docType);
      setProgress(100);
      toast.success('Document uploaded successfully!');
      setFile(null);
      setDocType('');
      loadDocs();
    } catch(err) {
      setError(err.message || 'Upload failed. Please try again.');
      toast.error('Upload failed.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const required = ['aadhaar_front','aadhaar_back','pan_card','photo'];
  const uploaded  = docs.map(d => d.doc_type);
  const missing   = required.filter(r => !uploaded.includes(r));

  return (
    <Layout>
      <Box sx={{ maxWidth:960, mx:'auto' }}>
        <Typography variant="h5" fontWeight={700} mb={0.5}>Document Upload</Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Upload required identity and employment documents. Accepted: PDF, JPEG, PNG (max 10 MB each).
        </Typography>

        {missing.length > 0 && (
          <Alert severity="warning" sx={{ mb:2 }}>
            <strong>Missing required documents: </strong>
            {missing.map(m => <Chip key={m} label={m.replace(/_/g,' ')} size="small" sx={{ ml:0.5 }} />)}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Upload card */}
          <Grid item xs={12} md={5}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Upload New Document</Typography>
                <FormControl fullWidth sx={{ mb:2 }}>
                  <InputLabel>Document Type</InputLabel>
                  <Select value={docType} label="Document Type" onChange={e => setDocType(e.target.value)}>
                    {DOC_TYPES.map(t => (
                      <MenuItem key={t.value} value={t.value}>
                        {t.label}
                        {required.includes(t.value) && <Chip label="Required" size="small" color="error" sx={{ ml:1 }} />}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <DropZone onDrop={setFile} file={file} />

                {progress > 0 && progress < 100 && (
                  <LinearProgress variant="determinate" value={progress}
                    sx={{ mt:1.5, height:6, borderRadius:3 }} />
                )}
                {error && <Alert severity="error" sx={{ mt:1.5 }}>{error}</Alert>}

                <Button fullWidth variant="contained" size="large" sx={{ mt:2 }}
                  onClick={handleUpload} disabled={uploading || !file || !docType}>
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </Button>
              </CardContent>
            </Card>

            {/* Required docs checklist */}
            <Card sx={{ mt:2 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={600} mb={1.5}>Required Documents</Typography>
                {required.map(r => (
                  <Box key={r} sx={{ display:'flex', alignItems:'center', gap:1, mb:0.8 }}>
                    <Chip size="small" label={uploaded.includes(r) ? '✓' : '○'}
                      color={uploaded.includes(r) ? 'success' : 'default'} sx={{ minWidth:28 }} />
                    <Typography variant="body2" color={uploaded.includes(r) ? 'text.primary' : 'text.secondary'}
                      sx={{ textDecoration: uploaded.includes(r) ? 'none' : 'none' }}>
                      {DOC_TYPES.find(d => d.value===r)?.label || r}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Document list */}
          <Grid item xs={12} md={7}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>Uploaded Documents ({docs.length})</Typography>
                <DocViewer documents={docs} isHR={isHR} onRefresh={loadDocs} />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Layout>
  );
}
