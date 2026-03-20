'use client';

import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { getStoredLanguage } from '@/lib/language';
import { useTranslation } from '@/lib/i18n-client';
import { apiClient } from '@/lib/api-client';
import contactData from '../../../../../json/contact.json';

const EMPTY_FORM = { name: '', email: '', subject: '', message: '' };

export default function ContactPage() {
  const { t } = useTranslation();
  const [language, setLanguage] = useState<'en' | 'ru' | 'am'>('ru');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredLanguage();
    const mapped = stored === 'hy' ? 'am' : stored === 'ka' ? 'en' : stored;
    setLanguage((mapped === 'am' || mapped === 'ru' || mapped === 'en') ? (mapped as 'en' | 'ru' | 'am') : 'ru');
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await apiClient.post('/api/v1/contact', formData, { skipAuth: true });
      setFormData(EMPTY_FORM);
      setSubmitted(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setSubmitError(t('contact.form.submitError') + (msg ? `: ${msg}` : ''));
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (submitted) setSubmitted(false);
    if (submitError) setSubmitError(null);
  };

  const address = contactData.address[language] ?? contactData.address.en;
  const workingHours = contactData.workingHours[language] ?? contactData.workingHours.en;

  const INFO_CARDS = [
    {
      key: 'phone',
      title: t('contact.callToUs.title'),
      desc: t('contact.callToUs.description'),
      value: contactData.phone,
      href: `tel:${contactData.phone}`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      ),
    },
    {
      key: 'email',
      title: t('contact.writeToUs.title'),
      desc: t('contact.writeToUs.description'),
      value: contactData.email,
      href: `mailto:${contactData.email}`,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      ),
    },
    {
      key: 'address',
      title: t('contact.headquarter.title'),
      desc: `${t('contact.headquarter.hours.weekdays')} · ${t('contact.headquarter.hours.saturday')}`,
      value: address,
      href: null,
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="w-full bg-[#2F3F3D] relative">

      {/* ── Decorative overlays ── */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] md:w-[650px] aspect-square max-h-[650px] pointer-events-none z-0 opacity-40"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>
      <div
        className="absolute top-[55%] right-0 w-[300px] md:w-[450px] aspect-square max-h-[450px] pointer-events-none z-0 opacity-25 translate-x-1/4"
        aria-hidden
      >
        <img src="/assets/hero/union-decorative.png" alt="" className="w-full h-full object-contain" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

        {/* ── Page header ── */}
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7CB342] mb-3">
            {t('common.navigation.contact')}
          </p>
          <h1 className="text-[#fff4de] text-5xl md:text-6xl lg:text-7xl font-light italic mb-5">
            {t('contact.callToUs.title').replace(':', '')}
          </h1>
          <div className="w-16 h-[2px] bg-[#7CB342] mx-auto mb-5" />
          <p className="text-[#fff4de]/50 text-base md:text-lg max-w-lg mx-auto">
            {t('contact.writeToUs.description')}
          </p>
        </div>

        {/* ── Info cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {INFO_CARDS.map((card) => (
            <div
              key={card.key}
              className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6 hover:border-[#7CB342]/40 transition-colors duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-[#7CB342]/15 border border-[#7CB342]/30 flex items-center justify-center text-[#7CB342] mb-5">
                {card.icon}
              </div>
              <h3 className="text-[#fff4de] font-light italic text-lg mb-2">{card.title}</h3>
              <p className="text-[#fff4de]/45 text-sm leading-relaxed mb-3">{card.desc}</p>
              {card.href ? (
                <a
                  href={card.href}
                  className="text-[#7CB342] text-sm font-medium hover:text-[#8fd44d] transition-colors"
                >
                  {card.value}
                </a>
              ) : (
                <p className="text-[#7CB342] text-sm font-medium">{card.value}</p>
              )}
            </div>
          ))}
        </div>

        {/* ── Main grid: form + extra info ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">

          {/* Form — 3/5 */}
          <div className="lg:col-span-3 bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#3d504e] bg-[#3d504e]/60">
              <svg className="w-5 h-5 text-[#7CB342]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
              <h2 className="text-[#fff4de] font-light italic text-lg">{t('contact.writeToUs.title')}</h2>
            </div>

            <div className="p-6">
              {/* Success state */}
              {submitted && (
                <div className="mb-6 p-4 bg-[#7CB342]/15 border border-[#7CB342]/40 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-[#7CB342] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[#7CB342] text-sm">{t('contact.form.submitSuccess')}</p>
                </div>
              )}

              {/* Error state */}
              {submitError && (
                <div className="mb-6 p-4 bg-red-400/10 border border-red-400/30 rounded-xl flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-red-400 text-sm">{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fff4de]/50 mb-1.5">
                      {t('contact.form.name')}
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={t('contact.form.namePlaceholder')}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-[#2F3F3D] border border-[#3d504e] rounded-xl text-[#fff4de] text-sm placeholder-[#fff4de]/25 focus:outline-none focus:border-[#7CB342]/70 focus:ring-1 focus:ring-[#7CB342]/30 disabled:opacity-40 transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fff4de]/50 mb-1.5">
                      {t('contact.form.email')}
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder={t('contact.form.emailPlaceholder')}
                      disabled={submitting}
                      className="w-full px-4 py-3 bg-[#2F3F3D] border border-[#3d504e] rounded-xl text-[#fff4de] text-sm placeholder-[#fff4de]/25 focus:outline-none focus:border-[#7CB342]/70 focus:ring-1 focus:ring-[#7CB342]/30 disabled:opacity-40 transition-colors"
                    />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fff4de]/50 mb-1.5">
                    {t('contact.form.subject')}
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder={t('contact.form.subjectPlaceholder')}
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-[#2F3F3D] border border-[#3d504e] rounded-xl text-[#fff4de] text-sm placeholder-[#fff4de]/25 focus:outline-none focus:border-[#7CB342]/70 focus:ring-1 focus:ring-[#7CB342]/30 disabled:opacity-40 transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#fff4de]/50 mb-1.5">
                    {t('contact.form.message')}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder={t('contact.form.messagePlaceholder')}
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-[#2F3F3D] border border-[#3d504e] rounded-xl text-[#fff4de] text-sm placeholder-[#fff4de]/25 focus:outline-none focus:border-[#7CB342]/70 focus:ring-1 focus:ring-[#7CB342]/30 disabled:opacity-40 transition-colors resize-none"
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 bg-[#7CB342] hover:bg-[#6aa535] text-white font-semibold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-[#7CB342]/20 hover:-translate-y-0.5 active:translate-y-0 text-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      {t('contact.form.submitting')}
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      {t('contact.form.submit')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Side info — 2/5 */}
          <div className="lg:col-span-2 space-y-5">

            {/* Working hours card */}
            <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-[#7CB342]/15 border border-[#7CB342]/30 flex items-center justify-center text-[#7CB342]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-[#fff4de] font-light italic">Working Hours</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[#3d504e]">
                  <span className="text-[#fff4de]/50 text-sm">{t('contact.headquarter.hours.weekdays').split(':')[0]}</span>
                  <span className="text-[#7CB342] text-sm font-medium">{t('contact.headquarter.hours.weekdays').split(': ')[1] ?? '9:00–20:00'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[#fff4de]/50 text-sm">{t('contact.headquarter.hours.saturday').split(':')[0]}</span>
                  <span className="text-[#7CB342] text-sm font-medium">{t('contact.headquarter.hours.saturday').split(': ')[1] ?? '11:00–15:00'}</span>
                </div>
              </div>
            </div>

            {/* Social links card */}
            <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6">
              <h3 className="text-[#fff4de] font-light italic mb-5">Social Media</h3>
              <div className="flex gap-3">
                {[
                  {
                    label: 'Instagram',
                    href: '#',
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Facebook',
                    href: '#',
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    ),
                  },
                  {
                    label: 'Telegram',
                    href: '#',
                    icon: (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                      </svg>
                    ),
                  },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-10 h-10 rounded-xl bg-[#2F3F3D] border border-[#3d504e] hover:border-[#7CB342]/60 flex items-center justify-center text-[#fff4de]/40 hover:text-[#7CB342] transition-all duration-200"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Working hours display */}
            <div className="bg-[#3d504e]/40 border border-[#3d504e] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#7CB342]/15 border border-[#7CB342]/30 flex items-center justify-center text-[#7CB342]">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                <h3 className="text-[#fff4de] font-light italic">{t('contact.headquarter.title')}</h3>
              </div>
              <p className="text-[#7CB342] text-sm font-medium">{address}</p>
              <p className="text-[#fff4de]/45 text-xs mt-2">{workingHours}</p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div className="relative w-full h-[420px] md:h-[500px] border-t border-[#3d504e]">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.1234567890123!2d44.5150!3d40.1812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x406aa2dab8fc8b5b%3A0x3d1479ab4e9b8c5e!2sAbovyan%20St%2C%20Yerevan%2C%20Armenia!5e0!3m2!1sen!2sam!4v1234567890123!5m2!1sen!2sam"
          width="100%"
          height="100%"
          style={{ border: 0, filter: 'grayscale(30%) invert(5%) sepia(5%) saturate(200%) hue-rotate(140deg)' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Location map"
        />
        {/* Address overlay badge */}
        <div className="absolute bottom-6 left-6 bg-[#2F3F3D]/90 backdrop-blur-sm border border-[#3d504e] rounded-xl px-5 py-3 pointer-events-none">
          <p className="text-[#7CB342] text-xs font-semibold uppercase tracking-widest mb-0.5">
            {t('contact.headquarter.title')}
          </p>
          <p className="text-[#fff4de] text-sm">{address}</p>
        </div>
      </div>

    </div>
  );
}
