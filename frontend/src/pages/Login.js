import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Link, Divider, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../App';
import toast from 'react-hot-toast';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function LoginPage() {
  const { login }     = useAuth();
  const navigate      = useNavigate();
  const [step, setStep]       = useState('login');  // 'login' | 'otp'
  const [userId, setUserId]   = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onLogin = async (data) => {
    setLoading(true);
    try {
      const res = await authService.login(data.email, data.password);
      setUserId(res.userId);
      setStep('otp');
      toast.success('OTP sent to your email!');
    } catch(err) {
      toast.error(err.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  const onVerifyOTP = async (data) => {
    setLoading(true);
    try {
      const res = await authService.verifyOTP(userId, data.otp);
      login(res.token, res.refreshToken, res.user);
      toast.success(`Welcome back, ${res.user.full_name}!`);
      navigate('/dashboard');
    } catch(err) {
      toast.error(err.message || 'OTP verification failed.');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
               background:'linear-gradient(135deg, #1a3660 0%, #2e6da4 100%)' }}>
      <Card sx={{ width: '100%', maxWidth: 420, m: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign:'center', mb: 3 }}>
            <Box sx={{ width:56, height:56, borderRadius:'50%', bgcolor:'primary.main',
                       display:'flex', alignItems:'center', justifyContent:'center', mx:'auto', mb:1.5 }}>
              <LockOutlinedIcon sx={{ color:'white', fontSize:28 }} />
            </Box>
            <Typography variant="h5">Employee Onboarding</Typography>
            <Typography variant="body2" color="text.secondary">
              {step === 'login' ? 'Sign in to your account' : 'Enter the OTP sent to your email'}
            </Typography>
          </Box>

          {step === 'login' ? (
            <form onSubmit={handleSubmit(onLogin)}>
              <TextField fullWidth label="Email Address" sx={{ mb:2 }} type="email"
                {...register('email', { required:'Email required', pattern:{ value:/^\S+@\S+$/i, message:'Invalid email' } })}
                error={!!errors.email} helperText={errors.email?.message} />
              <TextField fullWidth label="Password" sx={{ mb: 2.5 }} type="password"
                {...register('password', { required:'Password required' })}
                error={!!errors.password} helperText={errors.password?.message} />
              <Button fullWidth variant="contained" type="submit" size="large" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Box sx={{ textAlign:'center', mt:2 }}>
                <Link component={RouterLink} to="/register" variant="body2">
                  Don't have an account? Register
                </Link>
                {'  |  '}
                <Link component={RouterLink} to="/forgot-password" variant="body2">
                  Forgot Password?
                </Link>
              </Box>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onVerifyOTP)}>
              <Alert severity="info" sx={{ mb:2 }}>Check your email for a 6-digit OTP.</Alert>
              <TextField fullWidth label="Enter 6-digit OTP" sx={{ mb: 2.5 }}
                inputProps={{ maxLength:6, inputMode:'numeric', style:{ letterSpacing:8, fontSize:24, textAlign:'center' } }}
                {...register('otp', { required:'OTP required', minLength:{value:6,message:'6 digits'} })}
                error={!!errors.otp} helperText={errors.otp?.message} />
              <Button fullWidth variant="contained" type="submit" size="large" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </Button>
              <Button fullWidth sx={{ mt:1 }} onClick={() => setStep('login')}>← Back to Login</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
