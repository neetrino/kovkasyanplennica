'use client';

import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useTranslation } from '@/lib/i18n-client';
import { apiClient } from '@/lib/api-client';
import contactData from '../../../../../config/json/contact.json';

const EMPTY_FORM = { name: '', email: '', subject: '', message: '' };

/** Builds a tel: link from a human-readable phone string (e.g. +7 (3452) 73-33-00). */
function buildTelHref(displayPhone: string): string {
  const digits = displayPhone.replace(/\D/g, '');
  if (digits.length === 0) return '#';
  return `tel:+${digits}`;
}

export default function ContactPage() {
  const { t } = useTranslation();
  const language = 'ru' as const;
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const INFO_CARDS = [
    {
      key: 'phone',
      title: t('contact.callToUs.title'),
      desc: t('contact.callToUs.description'),
      value: contactData.phone,
      href: buildTelHref(contactData.phone),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
      ),
    },
    {
      key: 'delivery',
      title: t('contact.deliveryCall.title'),
      desc: t('contact.deliveryCall.description'),
      value: contactData.deliveryPhone,
      href: buildTelHref(contactData.deliveryPhone),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
          />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-16">
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

          {/* Map — 2/5 */}
          <div className="lg:col-span-2">
            <div className="relative w-full rounded-2xl overflow-hidden border border-[#3d504e] bg-[#3d504e]/40">
              <iframe
                src={contactData.mapEmbedUrl}
                width="100%"
                height="100%"
                className="block w-full h-[420px] md:h-[500px]"
                style={{ border: 0, filter: 'grayscale(30%) invert(5%) sepia(5%) saturate(200%) hue-rotate(140deg)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Location map"
              />
              <div className="absolute bottom-6 left-6 right-6 sm:right-auto bg-[#2F3F3D]/90 backdrop-blur-sm border border-[#3d504e] rounded-xl px-5 py-3 pointer-events-none max-w-md">
                <p className="text-[#7CB342] text-xs font-semibold uppercase tracking-widest mb-0.5">
                  {t('contact.headquarter.title')}
                </p>
                <p className="text-[#fff4de] text-sm">{address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
