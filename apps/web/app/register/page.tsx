'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Input, Card } from '@shop/ui';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, isLoading } = useAuth();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    console.log('🔐 [REGISTER PAGE] Form submitted');

    // Validation - check in order of importance
    console.log('🔍 [REGISTER PAGE] Validating form data...');
    console.log('🔍 [REGISTER PAGE] Form state:', {
      email: email.trim() || 'empty',
      phone: phone.trim() || 'empty',
      hasPassword: !!password,
      passwordLength: password.length,
      passwordsMatch: password === confirmPassword,
      acceptTerms,
    });

    if (!acceptTerms) {
      console.log('❌ [REGISTER PAGE] Validation failed: Terms not accepted');
      setError(t('register.errors.acceptTerms'));
      setIsSubmitting(false);
      return;
    }

    if (!email.trim() && !phone.trim()) {
      console.log('❌ [REGISTER PAGE] Validation failed: No email or phone');
      setError(t('register.errors.emailOrPhoneRequired'));
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      console.log('❌ [REGISTER PAGE] Validation failed: No password');
      setError(t('register.errors.passwordRequired'));
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      console.log('❌ [REGISTER PAGE] Validation failed: Password too short');
      setError(t('register.errors.passwordMinLength'));
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      console.log('❌ [REGISTER PAGE] Validation failed: Passwords do not match');
      setError(t('register.errors.passwordsDoNotMatch'));
      setIsSubmitting(false);
      return;
    }

    console.log('✅ [REGISTER PAGE] All validations passed');

    try {
      console.log('📤 [REGISTER PAGE] Calling register function...');
      console.log('📤 [REGISTER PAGE] Registration data:', {
        email: email.trim() || 'not provided',
        phone: phone.trim() || 'not provided',
        hasPassword: !!password,
        firstName: firstName.trim() || 'not provided',
        lastName: lastName.trim() || 'not provided',
      });
      
      await register({
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      
      console.log('✅ [REGISTER PAGE] Registration successful, redirecting...');
      // Redirect is handled by AuthContext
      // But we can also redirect here as a fallback
      setTimeout(() => {
        if (window.location.pathname === '/register') {
          console.log('🔄 [REGISTER PAGE] Fallback redirect to home...');
          window.location.href = '/';
        }
      }, 1000);
    } catch (err: any) {
      console.error('❌ [REGISTER PAGE] Registration error:', err);
      console.error('❌ [REGISTER PAGE] Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
      });
      setError(err.message || t('register.errors.registrationFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2F3F3D] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="w-full max-w-lg relative overflow-visible">
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[500px] md:w-[600px] lg:w-[700px] xl:w-[800px] aspect-square max-h-[800px] pointer-events-none z-[1]" aria-hidden>
          <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
        </div>
        <Card className="relative z-10 p-6 !rounded-[50px] overflow-hidden bg-white/20 backdrop-blur-md border border-white/25 shadow-xl text-white">
        {/* Դեկորատիվ վեկտորներ — ձախ վերև, աջ ներքև */}
        <div className="absolute top-0 left-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 pointer-events-none z-0 opacity-90" aria-hidden>
          <img src="/hero-vector-1.svg" alt="" className="w-full h-full object-contain object-left-top" />
        </div>
        <div className="absolute bottom-0 right-0 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 pointer-events-none z-0 opacity-90" aria-hidden>
          <img src="/hero-vector-2.svg" alt="" className="w-full h-full object-contain object-right-bottom rotate-180" />
        </div>
        <h1 className="relative z-10 text-3xl font-bold text-white mb-1">{t('register.title')}</h1>
        <p className="text-white/80 mb-4">{t('register.subtitle')}</p>

        {error && (
          <div className="mb-3 p-3 bg-red-500/20 border border-red-400/50 rounded-lg">
            <p className="text-sm text-red-100">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl">
              <label htmlFor="firstName" className="block text-sm font-medium text-white/90 mb-1.5">
                {t('register.form.firstName')}
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder={t('register.placeholders.firstName')}
                className="w-full rounded-xl font-normal text-gray-900 placeholder:text-gray-500"
                value={firstName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                disabled={isSubmitting || isLoading}
              />
            </div>
            <div className="rounded-xl">
              <label htmlFor="lastName" className="block text-sm font-medium text-white/90 mb-1.5">
                {t('register.form.lastName')}
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder={t('register.placeholders.lastName')}
                className="w-full rounded-xl font-normal text-gray-900 placeholder:text-gray-500"
                value={lastName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                disabled={isSubmitting || isLoading}
              />
            </div>
          </div>
          <div className="rounded-xl">
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-1.5">
              {t('register.form.email')}
            </label>
            <Input
              id="email"
              type="email"
              placeholder={t('register.placeholders.email')}
              className="w-full rounded-xl font-normal text-gray-900 placeholder:text-gray-500"
              value={email}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              disabled={isSubmitting || isLoading}
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-white/90 mb-1.5">
              {t('register.form.phone')}
            </label>
            <Input
              id="phone"
              type="tel"
              placeholder={t('register.placeholders.phone')}
              className="w-full font-normal text-gray-900 placeholder:text-gray-500 rounded-xl"
              value={phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
              disabled={isSubmitting || isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-1.5">
              {t('register.form.password')}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('register.placeholders.password')}
                className="w-full pr-10 rounded-xl font-normal text-gray-900 placeholder:text-gray-500"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
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
            <p className="mt-0.5 text-xs text-white/70">
              {t('register.passwordHint')}
            </p>
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-white/90 mb-1.5">
              {t('register.form.confirmPassword')}
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('register.placeholders.confirmPassword')}
                className="w-full pr-10 rounded-xl font-normal text-gray-900 placeholder:text-gray-500"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting || isLoading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-900 hover:text-black focus:outline-none"
                disabled={isSubmitting || isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-start">
            <input
              type="checkbox"
              id="terms"
              checked={acceptTerms}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setAcceptTerms(e.target.checked);
                // Clear error when checkbox is checked
                if (e.target.checked && error === t('register.errors.acceptTerms')) {
                  setError(null);
                }
              }}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              disabled={isSubmitting || isLoading}
              required
            />
            <label htmlFor="terms" className="ml-2 text-sm text-white/80">
              {t('register.form.acceptTerms')}{' '}
              <Link href="/terms" className="text-white/90 hover:text-white hover:underline">
                {t('register.form.termsOfService')}
              </Link>{' '}
              {t('register.form.and')}{' '}
              <Link href="/privacy" className="text-white/90 hover:text-white hover:underline">
                {t('register.form.privacyPolicy')}
              </Link>
            </label>
          </div>
          {!acceptTerms && error === t('register.errors.acceptTerms') && (
            <p className="text-xs text-red-200 -mt-2">{t('register.errors.mustAcceptTerms')}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting || isLoading}
            className="w-full inline-block bg-[#ffe5c2] text-[#2f3f3d] hover:bg-[#fadaac] disabled:opacity-60 disabled:cursor-not-allowed px-6 py-2.5 rounded-full font-semibold text-sm transition-colors"
          >
            {isSubmitting || isLoading ? t('register.form.creatingAccount') : t('register.form.createAccount')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-white/80">
            {t('register.form.alreadyHaveAccount')}{' '}
            <Link href="/login" className="text-white font-medium hover:underline">
              {t('register.form.signIn')}
            </Link>
          </p>
        </div>
        </Card>
      </div>
    </div>
  );
}

