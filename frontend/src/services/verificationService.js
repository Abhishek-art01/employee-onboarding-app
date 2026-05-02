import api from './api';

export const verificationService = {
  verifyAadhaar : (aadhaarNumber)                         => api.post('/verification/aadhaar', { aadhaarNumber }),
  verifyPAN     : (panNumber)                             => api.post('/verification/pan', { panNumber }),
  verifyBank    : (accountNumber, ifscCode, accountHolder) => api.post('/verification/bank', { accountNumber, ifscCode, accountHolder }),
  getStatus     : ()                                       => api.get('/verification/status'),
};
