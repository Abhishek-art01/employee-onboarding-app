import api from './api';

export const authService = {
  register       : (data)           => api.post('/auth/register', data),
  verifyEmail    : (userId, otp)    => api.post('/auth/verify-email', { userId, otp }),
  login          : (email, password) => api.post('/auth/login', { email, password }),
  verifyOTP      : (userId, otp)    => api.post('/auth/verify-otp', { userId, otp }),
  logout         : ()               => api.post('/auth/logout'),
  me             : ()               => api.get('/auth/me'),
  forgotPassword : (email)          => api.post('/auth/forgot-password', { email }),
  resetPassword  : (userId, otp, newPassword) => api.post('/auth/reset-password', { userId, otp, newPassword }),
  refresh        : (refreshToken)   => api.post('/auth/refresh', { refreshToken }),
};
