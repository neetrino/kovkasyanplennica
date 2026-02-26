'use client';

import { useState, FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input, Card } from '@shop/ui';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../lib/i18n-client';
import { Eye, EyeOff } from 'lucide-react';

function LoginPageContent() {
  const { t } = useTranslation();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get('redirect') || '/';

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    console.log('🔐 [LOGIN PAGE] Form submitted');

    // Validation
    if (!emailOrPhone.trim()) {
      setError(t('login.errors.emailOrPhoneRequired'));
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setError(t('login.errors.passwordRequired'));
      setIsSubmitting(false);
      return;
    }

    try {
      console.log('📤 [LOGIN PAGE] Calling login function...');
      await login(emailOrPhone.trim(), password);
      console.log('✅ [LOGIN PAGE] Login successful, redirecting to:', redirectTo);
      // Redirect to the specified page or home
      router.push(redirectTo);
    } catch (err: any) {
      console.error('❌ [LOGIN PAGE] Login error:', err);
      setError(err.message || t('login.errors.loginFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && !isLoading) {
      router.push(redirectTo);
    }
  }, [isLoggedIn, isLoading, redirectTo, router]);

  return (
    <div className="min-h-screen bg-[#2F3F3D] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-lg relative overflow-visible">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[500px] md:w-[600px] lg:w-[700px] xl:w-[800px] aspect-square max-h-[800px] pointer-events-none z-[1]" aria-hidden>
          <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
        </div>
        <Card className="relative z-10 p-8 !rounded-[50px] overflow-hidden bg-white/20 backdrop-blur-md border border-white/25 shadow-xl text-white">
          {/* Դեկորատիվ վեկտորներ — ձախ վերև, աջ ներքև */}
          <div className="absolute top-0 left-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 pointer-events-none z-0 opacity-90" aria-hidden>
            <img src="/hero-vector-1.svg" alt="" className="w-full h-full object-contain object-left-top" />
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 pointer-events-none z-0 opacity-90" aria-hidden>
            <img src="/hero-vector-2.svg" alt="" className="w-full h-full object-contain object-right-bottom rotate-180" />
          </div>
          <h1 className="relative z-10 text-3xl font-bold text-white mb-2">{t('login.title')}</h1>
          <p className="text-white/80 mb-8">{t('login.subtitle')}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
              <p className="text-sm text-red-100">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl">
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-white/90 mb-2">
                {t('login.form.emailOrPhone')}
              </label>
            <Input
              id="emailOrPhone"
              type="text"
              placeholder={t('login.form.emailOrPhonePlaceholder')}
              className="w-full rounded-xl font-normal text-gray-900 placeholder:text-gray-500"
              value={emailOrPhone}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmailOrPhone(e.target.value)}
              disabled={isSubmitting || isLoading}
              required
            />
          </div>
          <div className="rounded-xl">
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              {t('login.form.password')}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('login.form.passwordPlaceholder')}
                className="w-full pr-10 rounded-xl font-normal text-gray-900 placeholder:text-gray-500"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-900 hover:text-black focus:outline-none"
                disabled={isSubmitting || isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isSubmitting || isLoading}
              />
              <span className="ml-2 text-sm text-white/80">{t('login.form.rememberMe')}</span>
            </label>
            <Link
              href="/forgot-password"
              className="text-sm text-white/90 hover:text-white hover:underline"
            >
              {t('login.form.forgotPassword')}
            </Link>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full inline-block bg-[#ffe5c2] text-[#2f3f3d] hover:bg-[#fadaac] disabled:opacity-60 disabled:cursor-not-allowed px-6 py-2.5 rounded-full font-semibold text-sm transition-colors"
          >
            {isSubmitting || isLoading ? t('login.form.submitting') : t('login.form.submit')}
          </button>
        </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/80">
              {t('login.form.noAccount')}{' '}
              <Link href="/register" className="text-white font-medium hover:underline">
                {t('login.form.signUp')}
              </Link>
            </p>
          </div>
        </Card>
   
      </div>
    </div>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#2F3F3D] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-lg relative overflow-visible">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[500px] md:w-[600px] lg:w-[700px] xl:w-[800px] aspect-square max-h-[800px] pointer-events-none z-0 opacity-90" aria-hidden>
            <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
          </div>
          <Card className="relative z-10 p-8 !rounded-2xl overflow-hidden bg-white/20 backdrop-blur-md border border-white/25 shadow-xl w-full max-w-lg">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </Card>
        </div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}

