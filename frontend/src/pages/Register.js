import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, Grid, Link } from '@mui/material';
import { useForm } from 'react-hook-form';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate            = useNavigate();
  const [step, setStep]     = useState('register');
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState:{ errors } } = useForm();

  const onRegister = async (data) => {
    setLoading(true);
    try {
      const res = await authService.register(data);
      setUserId(res.userId);
      setStep('verify');
      toast.success('Registration successful! Check your email for OTP.');
    } catch(err) { toast.error(err.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const onVerify = async (data) => {
    setLoading(true);
    try {
      await authService.verifyEmail(userId, data.otp);
      toast.success('Email verified! Please log in.');
      navigate('/login');
    } catch(err) { toast.error(err.message || 'Verification failed.'); }
    finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
               background:'linear-gradient(135deg, #1a3660 0%, #2e6da4 100%)' }}>
      <Card sx={{ width:'100%', maxWidth:520, m:2 }}>
        <CardContent sx={{ p:4 }}>
          <Typography variant="h5" fontWeight={700} mb={0.5}>Create Account</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>Join the Employee Onboarding System</Typography>

          {step === 'register' ? (
            <form onSubmit={handleSubmit(onRegister)}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="Full Name"
                    {...register('fullName',{ required:'Name required' })}
                    error={!!errors.fullName} helperText={errors.fullName?.message} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Work Email" type="email"
                    {...register('email',{ required:'Email required', pattern:{ value:/^\S+@\S+$/i, message:'Invalid email' } })}
                    error={!!errors.email} helperText={errors.email?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Phone (India)"
                    {...register('phone',{ required:'Phone required' })}
                    error={!!errors.phone} helperText={errors.phone?.message} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Department"
                    {...register('department')} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Password" type="password"
                    {...register('password',{ required:'Required', minLength:{value:8,message:'Min 8 chars'},
                      pattern:{ value:/^(?=.*[A-Z])(?=.*\d)/, message:'Need uppercase + number' } })}
                    error={!!errors.password} helperText={errors.password?.message} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Confirm Password" type="password"
                    {...register('confirmPassword',{ required:'Required',
                      validate: v => v === watch('password') || 'Passwords do not match' })}
                    error={!!errors.confirmPassword} helperText={errors.confirmPassword?.message} />
                </Grid>
              </Grid>
              <Button fullWidth variant="contained" type="submit" size="large" sx={{ mt:3 }} disabled={loading}>
                {loading ? 'Registering...' : 'Create Account'}
              </Button>
              <Box sx={{ textAlign:'center', mt:2 }}>
                <Link component={RouterLink} to="/login" variant="body2">Already have an account? Sign In</Link>
              </Box>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onVerify)}>
              <Alert severity="success" sx={{ mb:2 }}>Account created! Enter the OTP sent to your email.</Alert>
              <TextField fullWidth label="6-digit OTP" inputProps={{ maxLength:6, inputMode:'numeric',
                style:{ letterSpacing:8, fontSize:24, textAlign:'center' } }}
                {...register('otp',{ required:'OTP required' })}
                error={!!errors.otp} helperText={errors.otp?.message} />
              <Button fullWidth variant="contained" type="submit" size="large" sx={{ mt:2 }} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
