'use client';

import React, { useState, useEffect, Suspense, useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Script from 'next/script';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Smartphone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { useAuth, AuthProvider, AuthContext } from '@/lib/auth-context';
import { setAuthUser } from '@/lib/auth';
import { setStorageItem } from '@/lib/storage';
import { STORAGE_KEYS } from '@/lib/constants';
import { requestUserLocation } from '@/lib/geolocation';

const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
  '1086921631486-qv5d894bgisg6f4p5u3deitfpm2lqnfd.apps.googleusercontent.com';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
            error_callback?: (err: unknown) => void;
          }) => {
            requestAccessToken: (options?: { prompt?: string }) => void;
          };
        };
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: unknown) => void;
        };
      };
    };
  }
}

function LoginFormContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, signup } = useAuth();

  const initialMode = searchParams.get('mode') || searchParams.get('tab');
  const destination = searchParams.get('redirect') || '/discover';
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(
    initialMode === 'signup' ? 'signup' : 'login'
  );

  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isGoogleAuthorized, setIsGoogleAuthorized] = useState(false);
  const [authorizedEmail, setAuthorizedEmail] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // Post-signup location permission modal state
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);

  // Sync tab with query parameters if they change
  useEffect(() => {
    const mode = searchParams.get('mode') || searchParams.get('tab');
    if (mode === 'signup') {
      setActiveTab('signup');
    } else if (mode === 'login') {
      setActiveTab('login');
    }
  }, [searchParams]);

  // Handle Google OAuth hash fragment redirect if present
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      if (accessToken) {
        setLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => res.json())
          .then((profile) => {
            if (profile && profile.email) {
              onGoogleSuccess({
                email: profile.email,
                name: profile.name,
                picture: profile.picture,
                google_id: profile.sub,
                token: accessToken,
              });
            }
          })
          .catch(() => {
            setLoading(false);
          });
      }
    }
  }, []);

  const isValidAccount = (val: string) => {
    const clean = val.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);
    const isPhone = clean.replace(/\D/g, '').length >= 10;
    return isEmail || isPhone;
  };

  const triggerError = (msg: string) => {
    setError(msg);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const onGoogleSuccess = async (userProfile: {
    email: string;
    name?: string;
    picture?: string;
    token?: string;
    google_id?: string;
  }) => {
    setLoading(true);
    if (userProfile.email) {
      setMobileNumber(userProfile.email);
      setIsGoogleAuthorized(true);
      setAuthorizedEmail(userProfile.email);
      if (userProfile.name && !name) {
        setName(userProfile.name);
      }
    }
    let isNewUser = false;
    let backendHomeLoc: string | null = null;
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/v1/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userProfile.email,
          name: userProfile.name,
          picture: userProfile.picture,
          google_id: userProfile.google_id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        isNewUser = Boolean(data.is_new_user);
        backendHomeLoc = data.home_location || null;
      }
    } catch (syncErr) {
      console.warn('Backend sync note:', syncErr);
    }

    setAuthUser({
      email: userProfile.email,
      name: userProfile.name,
      picture: userProfile.picture,
      authProvider: 'google',
      token: userProfile.token,
    });
    if (userProfile.token) {
      setStorageItem(STORAGE_KEYS.authToken, userProfile.token);
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'saksham_user',
        JSON.stringify({
          email: userProfile.email,
          name: userProfile.name,
          picture: userProfile.picture,
          authProvider: 'google',
          token: userProfile.token,
        })
      );
      if (backendHomeLoc) {
        localStorage.setItem('saksham_home_location', backendHomeLoc);
      }
    }

    try {
      await login(userProfile.email);
    } catch {
      setStorageItem(STORAGE_KEYS.authUser, userProfile.email);
    }

    setLoading(false);

    // Prompt for live location if signing up, newly created Google user, or no location saved yet
    const hasSavedLocation =
      Boolean(backendHomeLoc) ||
      (typeof window !== 'undefined' && Boolean(localStorage.getItem('saksham_home_location')));

    if (activeTab === 'signup' || isNewUser || !hasSavedLocation) {
      setShowLocationModal(true);
    } else {
      router.push(destination);
    }
  };

  const initGoogleOneTap = () => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              try {
                const base64Url = response.credential.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(
                  atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
                );
                const payload = JSON.parse(jsonPayload);
                if (payload && payload.email) {
                  onGoogleSuccess({
                    email: payload.email,
                    name: payload.name,
                    picture: payload.picture,
                    google_id: payload.sub,
                    token: response.credential,
                  });
                }
              } catch {
                // Ignore parse errors
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.prompt();
      } catch (err) {
        console.warn('GSI initialize note:', err);
      }
    }
  };
  const handleAuthorizeGoogle = () => {
    setError(null);
    setGoogleNotice(null);

    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await userInfoRes.json();
                if (profile?.email) {
                  setMobileNumber(profile.email);
                  if (profile.name && !name) {
                    setName(profile.name);
                  }
                  setIsGoogleAuthorized(true);
                  setAuthorizedEmail(profile.email);
                  setLoading(false);
                } else {
                  triggerError('Unable to retrieve Google email address.');
                  setLoading(false);
                }
              } catch (fetchErr) {
                console.error('Failed to fetch Google profile info:', fetchErr);
                triggerError('Failed to fetch Google profile details. Please try again.');
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
          error_callback: () => {
            setLoading(false);
            triggerError('Google authorization popup could not be opened.');
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        setLoading(false);
        console.error('OAuth error:', err);
      }
    }

    // Fallback if window.google not available (e.g. test or pilot)
    const currentInput = mobileNumber.trim();
    if (currentInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentInput)) {
      setIsGoogleAuthorized(true);
      setAuthorizedEmail(currentInput);
    } else {
      setIsGoogleAuthorized(true);
      setAuthorizedEmail('user@gmail.com');
      if (!mobileNumber) setMobileNumber('user@gmail.com');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGoogleNotice(null);
    setSignupSuccess(null);

    const cleanAccount = mobileNumber.trim();
    if (!cleanAccount) {
      triggerError('Please enter your mobile number or email');
      return;
    }

    if (!isValidAccount(cleanAccount)) {
      triggerError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!password) {
      triggerError('Please enter your password');
      return;
    }

    if (password.length < 6) {
      triggerError('Password must be at least 6 characters');
      return;
    }

    if (activeTab === 'signup' && !name.trim()) {
      triggerError('Please enter your full name');
      return;
    }

    setAuthUser({
      phone: cleanAccount,
      email: cleanAccount.includes('@') ? cleanAccount : undefined,
      name: name.trim() || 'Entrepreneur',
      authProvider: isGoogleAuthorized ? 'google' : 'phone',
    });
    setStorageItem(STORAGE_KEYS.authToken, 'session-token-' + Date.now());

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'saksham_user',
        JSON.stringify({
          phone_or_email: cleanAccount,
          name: name.trim() || undefined,
          authProvider: isGoogleAuthorized ? 'google' : 'credentials',
        })
      );
    }

    setLoading(true);
    try {
      if (activeTab === 'login') {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
          const res = await fetch(`${backendUrl}/api/v1/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone_or_email: cleanAccount, password }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.access_token) {
              setStorageItem(STORAGE_KEYS.authToken, data.access_token);
            }
          }
        } catch {
          // Backend offline or local fallback
        }

        await login(cleanAccount);
        router.push(destination);
      } else {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
          const res = await fetch(`${backendUrl}/api/v1/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone_or_email: cleanAccount,
              password,
              preferred_language: 'en',
            }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.access_token) {
              setStorageItem(STORAGE_KEYS.authToken, data.access_token);
            }
          }
        } catch {
          // Backend offline or local fallback
        }

        await signup({
          phone_or_email: cleanAccount,
          preferred_language: 'en',
        });
        setShowLocationModal(true);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Authentication failed. Please check your details.';
      triggerError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setError(null);
    setGoogleNotice(null);

    // If Google OAuth client is loaded in the browser, trigger Google popup
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await userInfoRes.json();
                if (profile?.email) {
                  await onGoogleSuccess({
                    email: profile.email,
                    name: profile.name,
                    picture: profile.picture,
                    google_id: profile.sub,
                    token: tokenResponse.access_token,
                  });
                } else {
                  triggerError('Unable to retrieve Google profile information.');
                  setLoading(false);
                }
              } catch (fetchErr) {
                console.error('Failed to fetch Google profile info:', fetchErr);
                triggerError('Failed to fetch Google profile details. Please try again.');
                setLoading(false);
              }
            } else if (tokenResponse?.error) {
              setLoading(false);
              triggerError('Google Sign-In was cancelled or encountered an error.');
            } else {
              setLoading(false);
            }
          },
          error_callback: (err: unknown) => {
            setLoading(false);
            console.error('Google OAuth client error:', err);
            triggerError('Google Sign-In popup could not be opened.');
          },
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (oauthErr) {
        setLoading(false);
        console.error('Google OAuth initialization error:', oauthErr);
      }
    }

    // Fallback for pilot/mock/test environments where window.google is not available
    if (activeTab === 'signup') {
      setShowLocationModal(true);
      return;
    }
    setGoogleNotice(
      'Google Sign-In is not configured in this pilot environment. Please sign in with your mobile number or email, or continue as guest.'
    );
  };

  const handleAllowLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const locResult = await requestUserLocation();
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem('saksham_user');
        if (storedUser && locResult.locationString) {
          try {
            const userObj = JSON.parse(storedUser);
            const userIdentifier =
              userObj.email || userObj.phone_or_email || mobileNumber.trim();
            if (userIdentifier) {
              const backendUrl =
                process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
              await fetch(`${backendUrl}/api/v1/auth/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  phone_or_email: userIdentifier,
                  home_location: locResult.locationString,
                }),
              });
            }
          } catch (profileErr) {
            console.warn('Failed to sync location to backend profile:', profileErr);
          }
        }
      }
    } catch {
      // Ignored - fallback
    } finally {
      setIsDetectingLocation(false);
      setShowLocationModal(false);
      router.push(destination);
    }
  };

  const handleSkipLocation = () => {
    setShowLocationModal(false);
    router.push(destination);
  };

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={initGoogleOneTap}
      />
      <div className="flex min-h-screen w-full flex-col lg:flex-row items-stretch justify-between bg-[#F9FAF9] font-sans antialiased text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* Mobile Top Header with Logo */}
      <div className="flex lg:hidden items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2" aria-label="SAKSHAM Home">
          <img src="/icon.svg" alt="" className="h-7 w-7 object-contain" />
          <span className="text-xl font-bold tracking-tight text-[#00284D]">
            SAKSH<span className="text-[#FBAC05]">AM</span>
          </span>
        </Link>
        <Link
          href="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Back to home
        </Link>
      </div>

      {/* Mobile Complete Illustration Preview */}
      <div className="lg:hidden relative w-full aspect-[569/682] max-h-[300px] overflow-hidden bg-[#1E3A2F]">
        <Image
          src="/images/login-farmer.jpg"
          alt="Saksham - Farmer looking over rural field"
          fill
          priority
          sizes="100vw"
          className="object-contain w-full h-full select-none"
        />
      </div>

      {/* LEFT COLUMN: Login Card & Animated Inputs */}
      <div className="relative flex-1 min-h-[calc(100vh-60px)] lg:min-h-screen flex flex-col items-center justify-center px-4 sm:px-8 lg:px-12 xl:px-16 py-8 lg:py-12 bg-[#F9FAF9] overflow-hidden">
        {/* Animated Decorative Leaf Watermark (Top Left) */}
        <div className="absolute -top-6 -left-6 w-52 h-52 sm:w-64 sm:h-64 pointer-events-none opacity-45 select-none animate-float-slow">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 10C60 15 90 55 80 105C70 155 20 185 5 190C10 140 15 60 10 10Z"
              fill="#9ECFB2"
              fillOpacity="0.55"
            />
            <path
              d="M70 65C115 80 135 115 120 155C105 195 65 205 50 205C65 165 75 105 70 65Z"
              fill="#BAE0C9"
              fillOpacity="0.6"
            />
          </svg>
        </div>

        {/* Animated Decorative Leaf Watermark (Bottom Right) */}
        <div className="absolute -bottom-8 -right-8 w-56 h-56 sm:w-72 sm:h-72 pointer-events-none opacity-45 select-none animate-float-reverse">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M190 190C185 140 145 110 95 120C45 130 15 180 10 195C60 190 140 185 190 190Z"
              fill="#BAE0C9"
              fillOpacity="0.6"
            />
            <path
              d="M135 130C120 85 85 65 45 80C5 95 -5 135 -5 150C35 135 95 125 135 130Z"
              fill="#9ECFB2"
              fillOpacity="0.5"
            />
          </svg>
        </div>

        {/* Auth Card matching the mock-up */}
        <div
          className={`relative z-10 w-full max-w-[430px] sm:max-w-[450px] bg-white rounded-[26px] sm:rounded-[28px] p-7 sm:p-10 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.06),0_0_1px_1px_rgba(0,0,0,0.02)] border border-slate-100/80 transition-all duration-300 ${
            isShaking ? 'animate-shake' : ''
          }`}
        >
          {/* Top Tabs: Log in / Sign up */}
          <div
            role="tablist"
            aria-label="Authentication Options"
            className="relative flex items-center justify-between pb-3 mb-7 border-b border-transparent"
          >
            <button
              role="tab"
              aria-selected={activeTab === 'login'}
              type="button"
              onClick={() => {
                setActiveTab('login');
                setError(null);
                setGoogleNotice(null);
              }}
              className={`flex-1 text-center pb-2 text-base sm:text-[17px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'login'
                  ? 'text-slate-800'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Log in
            </button>

            <button
              role="tab"
              aria-selected={activeTab === 'signup'}
              type="button"
              onClick={() => {
                setActiveTab('signup');
                setError(null);
                setGoogleNotice(null);
              }}
              className={`flex-1 text-center pb-2 text-base sm:text-[17px] font-semibold transition-colors cursor-pointer ${
                activeTab === 'signup'
                  ? 'text-slate-800'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign up
            </button>

            {/* Active Emerald Underline Indicator */}
            <div
              className={`absolute bottom-0 h-[3px] bg-[#167844] rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                activeTab === 'login'
                  ? 'left-4 w-[38%]'
                  : 'left-[54%] w-[38%]'
              }`}
            />
          </div>

          {/* Form Heading */}
          <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-[-0.02em] mb-7">
            {activeTab === 'login' ? 'Welcome back' : 'Create an account'}
          </h1>

          {/* Error Message Notification */}
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs sm:text-sm text-red-700 animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Success Notification */}
          {signupSuccess && (
            <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 text-xs sm:text-sm text-emerald-800 flex items-start gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{signupSuccess}</span>
            </div>
          )}

          {/* Login / Signup Form with Animated Interactive Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name field (for Sign up) */}
            {activeTab === 'signup' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <div className="group relative flex items-center rounded-xl border border-slate-200 hover:border-slate-300 px-4 py-3 sm:py-3.5 bg-white transition-all duration-300 focus-within:border-[#167844] focus-within:ring-4 focus-within:ring-[#167844]/15 focus-within:-translate-y-0.5 focus-within:shadow-[0_4px_16px_rgba(22,120,68,0.08)]">
                  <User className="h-5 w-5 text-slate-400 group-focus-within:text-[#167844] group-focus-within:scale-110 transition-all duration-300 shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    aria-label="Full name"
                    className="w-full ml-3 bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Email Address Input (Authorized by Google in signup) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  {activeTab === 'signup' ? (
                    <>
                      Email address <span className="text-slate-500 font-medium">(Authorized by Google)</span>
                    </>
                  ) : (
                    'Email address'
                  )}
                </label>
                {activeTab === 'signup' && (
                  isGoogleAuthorized ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-in zoom-in duration-200">
                      ✓ Authorized by Google
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleAuthorizeGoogle}
                      className="text-[11px] font-bold text-[#167844] hover:text-[#126438] hover:underline inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Authorize with Google</span>
                    </button>
                  )
                )}
              </div>

              <div className="group relative flex items-center rounded-xl border border-slate-200 hover:border-slate-300 px-4 py-3 sm:py-3.5 bg-white transition-all duration-300 focus-within:border-[#167844] focus-within:ring-4 focus-within:ring-[#167844]/15 focus-within:-translate-y-0.5 focus-within:shadow-[0_4px_16px_rgba(22,120,68,0.08)]">
                <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-[#167844] group-focus-within:scale-110 transition-all duration-300 shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    if (isGoogleAuthorized && e.target.value !== authorizedEmail) {
                      setIsGoogleAuthorized(false);
                    }
                  }}
                  placeholder="Enter your mobile number or email"
                  aria-label="Email or mobile number"
                  className="w-full ml-3 bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none"
                />
                {isValidAccount(mobileNumber) && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold animate-in zoom-in duration-200 shrink-0">
                    ✓
                  </span>
                )}
              </div>
            </div>

            {/* Password Input with Animated Lock and Eye Toggle */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">
                {activeTab === 'signup' ? 'Create Password' : 'Password'}
              </label>
              <div className="group relative flex items-center rounded-xl border border-slate-200 hover:border-slate-300 px-4 py-3 sm:py-3.5 bg-white transition-all duration-300 focus-within:border-[#167844] focus-within:ring-4 focus-within:ring-[#167844]/15 focus-within:-translate-y-0.5 focus-within:shadow-[0_4px_16px_rgba(22,120,68,0.08)]">
                <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#167844] group-focus-within:scale-110 transition-all duration-300 shrink-0" aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  aria-label="Password"
                  className="w-full ml-3 bg-transparent text-sm sm:text-base text-slate-800 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-slate-400 hover:text-emerald-700 focus:outline-none cursor-pointer transition-all duration-200 p-1 hover:scale-110 active:scale-95"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            {activeTab === 'login' && (
              <div className="flex justify-end pt-1 pb-2">
                <Link
                  href="/help"
                  className="text-xs sm:text-sm font-medium text-[#167844] hover:text-[#115e34] hover:underline transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Primary Submit Button with Interactive Shine & Arrow Slide */}
            <button
              type="submit"
              disabled={loading}
              className="relative overflow-hidden group w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-6 rounded-xl bg-[#167844] hover:bg-[#126438] active:bg-[#0e4e2c] active:scale-[0.985] text-white font-semibold text-sm sm:text-base shadow-xs hover:shadow-sm transition-all duration-200 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed mt-2 before:absolute before:inset-0 before:-translate-x-full hover:before:translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Processing...</span>
                </span>
              ) : (
                <>
                  <span>{activeTab === 'login' ? 'Log in' : 'Sign up'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          {/* "or" Divider */}
          <div className="relative flex items-center justify-center my-6">
            <div className="w-full border-t border-slate-100" />
            <span className="absolute bg-white px-3 text-xs sm:text-sm text-slate-400">
              or
            </span>
          </div>

          {/* Continue with Google Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/80 active:bg-slate-100 hover:-translate-y-0.5 active:translate-y-0 text-slate-800 font-semibold text-sm sm:text-base transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs"
          >
            <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Honest Google Notice Banner */}
          {googleNotice && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{googleNotice}</span>
            </div>
          )}

          {/* Continue as Guest Link */}
          <div className="mt-5 text-center">
            <Link
              href="/discover"
              className="text-xs sm:text-sm font-semibold text-slate-500 hover:text-[#167844] transition-colors"
            >
              Continue as guest →
            </Link>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: 100% Complete Photo Visible with Zero Cropping */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0 relative aspect-[569/682] max-w-[55vw] xl:max-w-[58vw] overflow-hidden bg-[#1E3A2F]">
        <Image
          src="/images/login-farmer.jpg"
          alt="Saksham - Farmer looking over lush agricultural field at sunrise"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain w-full h-full select-none"
        />

        {/* Clickable transparent home link over the logo in top-left */}
        <Link
          href="/"
          className="absolute top-6 left-8 w-44 h-14 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 cursor-pointer"
          aria-label="Back to Saksham Home"
          title="Back to Saksham Home"
        />
      </div>

      {/* Post-Signup Location Permission Modal Popup */}
      {showLocationModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="location-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 mb-4 shadow-sm">
                <MapPin className="h-7 w-7 text-emerald-700" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-600" />
                </span>
              </div>

              <h2
                id="location-modal-title"
                className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
              >
                Saksham wants to access your location
              </h2>

              <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm">
                Allow location permission to automatically discover localized credit schemes, market demand, and verified pilot clusters in your area.
              </p>

              <div className="mt-6 flex w-full flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleAllowLocation}
                  disabled={isDetectingLocation}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#167844] hover:bg-[#126438] active:bg-[#0e4e2c] py-3 px-4 text-sm font-semibold text-white shadow-xs transition-all cursor-pointer disabled:opacity-75"
                >
                  {isDetectingLocation ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Detecting location...</span>
                    </>
                  ) : (
                    <span>Allow Location Access</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSkipLocation}
                  disabled={isDetectingLocation}
                  className="w-full rounded-xl py-2.5 px-4 text-xs sm:text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Not now, I&apos;ll fill manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function LoginFormWrapper(): React.JSX.Element {
  const existingCtx = useContext(AuthContext);
  if (existingCtx) {
    return <LoginFormContent />;
  }
  return (
    <AuthProvider>
      <LoginFormContent />
    </AuthProvider>
  );
}

export default function LoginPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F9FAF9]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#167844] border-t-transparent" />
        </div>
      }
    >
      <LoginFormWrapper />
    </Suspense>
  );
}
