import api from './api';

export const onboardingService = {
  createForm    : ()             => api.post('/onboarding'),
  getMyForm     : ()             => api.get('/onboarding/my'),
  saveStep      : (step, data)   => api.patch(`/onboarding/step/${step}`, data),
  getAllForms    : (params)       => api.get('/onboarding/all', { params }),
  getFormById   : (id)           => api.get(`/onboarding/${id}`),
  reviewForm    : (id, data)     => api.patch(`/onboarding/${id}/review`, data),
  getDashStats  : ()             => api.get('/onboarding/stats'),
};
