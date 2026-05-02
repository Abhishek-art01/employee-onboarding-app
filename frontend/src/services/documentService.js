import api from './api';

export const documentService = {
  upload: (file, docType, formId) => {
    const fd = new FormData();
    fd.append('document', file);
    fd.append('docType', docType);
    if (formId) fd.append('formId', formId);
    return api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  listMyDocs    : ()    => api.get('/documents/my'),
  listUserDocs  : (uid) => api.get(`/documents/user/${uid}`),
  download      : (id)  => api.get(`/documents/${id}/download`),
  verify        : (id, status, note) => api.patch(`/documents/${id}/verify`, { status, note }),
  delete        : (id)  => api.delete(`/documents/${id}`),
};
