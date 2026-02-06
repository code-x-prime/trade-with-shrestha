'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { authAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import PasswordInput from '@/components/PasswordInput';
import { Loader2, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function AuthContent() {
  const { login, signup, verifyOTP, googleLogin } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mode, setMode] = useState('login'); // 'login', 'signup', 'otp', 'forgot-password', 'reset-password'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOTP, setCanResendOTP] = useState(false);

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect');
  const errorParam = searchParams.get('error');

  // Read mode from URL query params
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'login' || urlMode === 'signup' || urlMode === 'otp' || urlMode === 'forgot-password' || urlMode === 'reset-password') {
      setMode(urlMode);
    }
    
    // Show error message if unauthorized
    if (errorParam === 'unauthorized') {
      setError('You do not have permission to access that page.');
    }
  }, [searchParams, errorParam]);

  // OTP Timer
  useEffect(() => {
    let interval = null;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => {
          if (prev <= 1) {
            setCanResendOTP(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setCanResendOTP(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpTimer]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || undefined,
      });

      if (result.success) {
        setSuccess('OTP sent to your email! Please check your inbox.');
        router.push('/auth?mode=otp');
        setMode('otp');
        setOtpTimer(60); // 1 minute timer
        setCanResendOTP(false);
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password, redirectUrl);
      if (!result.success) {
        setError(result.error || 'Login failed');
        setLoading(false);
      }
      // Success: loading rehne do, redirect tak button disable rahega
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await verifyOTP(formData.email, formData.otp, 'EMAIL_VERIFY', redirectUrl);
      if (!result.success) {
        setError(result.error || 'OTP verification failed');
        setLoading(false);
      }
      // Success: loading rehne do, redirect tak button disable
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authAPI.forgotPassword(formData.email);
      if (response.success) {
        setSuccess('OTP sent to your email! Please check your inbox.');
        router.push('/auth?mode=reset-password');
        setMode('reset-password');
        setOtpTimer(60);
        setCanResendOTP(false);
      } else {
        setError(response.message || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        setSuccess('Password reset successful! Redirecting to login...');
        setTimeout(() => {
          router.push('/auth?mode=login');
          setMode('login');
          setFormData({ ...formData, otp: '', newPassword: '', confirmPassword: '' });
        }, 2000);
      } else {
        setError(response.message || 'Password reset failed');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResendOTP) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (mode === 'otp') {
        // Resend signup OTP
        const result = await signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
        });
        if (result.success) {
          setSuccess('OTP resent to your email!');
          setOtpTimer(60);
          setCanResendOTP(false);
        }
      } else if (mode === 'reset-password') {
        // Resend password reset OTP
        const response = await authAPI.forgotPassword(formData.email);
        if (response.success) {
          setSuccess('OTP resent to your email!');
          setOtpTimer(60);
          setCanResendOTP(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load Google Identity Services script on mount
    if (typeof window !== 'undefined') {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      
      if (!existingScript && !window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setTimeout(() => {
            initializeGoogleSignIn();
          }, 100);
        };
        script.onerror = () => {
          console.error('Failed to load Google Sign-In script');
          const buttonContainer = document.getElementById('google-signin-button');
          if (buttonContainer) {
            buttonContainer.style.display = 'none';
          }
        };
        document.head.appendChild(script);
      } else if (window.google) {
        setTimeout(() => {
          initializeGoogleSignIn();
        }, 100);
      }
    }

    return () => {
      // Cleanup if needed
    };
  }, [mode]);

  const initializeGoogleSignIn = () => {
    if (typeof window === 'undefined' || !window.google) {
      console.warn('Google Sign-In script not loaded yet');
      return;
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId || clientId === 'your-google-client-id' || clientId.trim() === '') {
      console.warn('Google Client ID not configured. Google Sign-In button will be hidden.');
      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        buttonContainer.style.display = 'none';
      }
      const separator = document.querySelector('.relative.flex.justify-center');
      if (separator && separator.parentElement) {
        separator.parentElement.style.display = 'none';
      }
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCallback,
      });

      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        buttonContainer.innerHTML = '';
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          type: 'standard',
        });
      }
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
      const buttonContainer = document.getElementById('google-signin-button');
      if (buttonContainer) {
        buttonContainer.style.display = 'none';
      }
    }
  };

  const handleGoogleCallback = async (response) => {
    try {
      setLoading(true);
      setError('');

      const credential = response.credential;
      const base64Url = credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const userData = JSON.parse(jsonPayload);

      const result = await googleLogin({
        googleId: userData.sub,
        email: userData.email,
        name: userData.name,
        avatar: userData.picture,
      });

      if (!result.success) {
        setError(result.error || 'Google login failed');
        setLoading(false);
      }
      // Success: loading rehne do, redirect tak button/UI disable
    } catch (err) {
      setError(err.message || 'Google login failed');
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 to-brand-100 dark:from-gray-900 dark:to-gray-950 p-4">
      {/* Go to Home Button */}
      <Link
        href="/"
        className="fixed top-4 left-4 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 group"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <Home className="h-4 w-4" />
        <span className="text-sm font-medium">Go to Home</span>
      </Link>

      <Card className="w-full max-w-md dark:bg-gray-800/50 dark:border-gray-700">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'signup' && 'Create Account'}
            {mode === 'otp' && 'Verify Email'}
            {mode === 'forgot-password' && 'Forgot Password'}
            {mode === 'reset-password' && 'Reset Password'}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login' && 'Login to your account'}
            {mode === 'signup' && 'Sign up to get started'}
            {mode === 'otp' && 'Enter the OTP sent to your email'}
            {mode === 'forgot-password' && 'Enter your email to receive OTP'}
            {mode === 'reset-password' && 'Enter OTP and new password'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-md">
              {success}
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (loading) return;
                    router.push('/auth?mode=forgot-password');
                    setMode('forgot-password');
                  }}
                  disabled={loading}
                  className="text-sm text-brand-600 hover:underline disabled:opacity-50 disabled:pointer-events-none"
                >
                  Forgot Password?
                </button>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Logging in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </form>
          )}

          {mode === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  showStrength={true}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing up...
                  </>
                ) : (
                  'Sign Up'
                )}
              </Button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendOTP}
                disabled={!canResendOTP || loading}
              >
                {canResendOTP ? 'Resend OTP' : `Resend in ${formatTime(otpTimer)}`}
              </Button>
            </form>
          )}

          {mode === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  router.push('/auth?mode=login');
                  setMode('login');
                }}
              >
                Back to Login
              </Button>
            </form>
          )}

          {mode === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="123456"
                  value={formData.otp}
                  onChange={handleInputChange}
                  required
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                  disabled={loading}
                />
                {otpTimer > 0 && (
                  <p className="text-xs text-center text-muted-foreground">
                    Resend OTP in {formatTime(otpTimer)}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <PasswordInput
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  showStrength={true}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <PasswordInput
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendOTP}
                disabled={!canResendOTP || loading}
              >
                {canResendOTP ? 'Resend OTP' : `Resend in ${formatTime(otpTimer)}`}
              </Button>
            </form>
          )}

          {mode !== 'otp' && mode !== 'forgot-password' && mode !== 'reset-password' && 
           process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && 
           process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID !== 'your-google-client-id' && 
           process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID.trim() !== '' && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              <div id="google-signin-button" className="w-full flex justify-center"></div>
            </>
          )}

          <div className="text-center text-sm">
            {mode === 'login' && (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    router.push('/auth?mode=signup');
                    setMode('signup');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-brand-600 hover:underline font-medium"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    router.push('/auth?mode=login');
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                  className="text-brand-600 hover:underline font-medium"
                >
                  Login
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center dark:bg-gray-900"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
