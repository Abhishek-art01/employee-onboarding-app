import api from './api';

const adminService = {
  getDashboard   : ()           => api.get('/admin/dashboard'),
  listUsers      : (params)     => api.get('/admin/users', { params }),
  updateStatus   : (id, data)   => api.patch(`/admin/users/${id}/status`, data),
  updateRole     : (id, data)   => api.patch(`/admin/users/${id}/role`, data),
  getAuditLogs   : (params)     => api.get('/audit', { params }),
  verifyDocument : (id, data)   => api.patch(`/documents/${id}/verify`, data),
};

export default adminService;
