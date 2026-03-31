import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import contactIt from '@/public/i18n/contact.it.json';
import contactEn from '@/public/i18n/contact.en.json';

export default function ContactPage({ locale = 'it' }) {
  const t = locale === 'en' ? contactEn : contactIt;
  const roleOptions = t.roles;

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company_name: '',
    role_label: roleOptions[0],
    message: '',
    website: '',
  });

  const [status, setStatus] = useState({ type: null, message: '' });

  usePublicSeo({
    title: t.seoTitle,
    description: t.subtitle,
    canonicalPath: locale === 'en' ? '/en/contatti' : '/contatti',
    locale,
    alternateItPath: '/contatti',
    alternateEnPath: '/en/contatti',
  });

  const isValid = useMemo(
    () => form.full_name.trim().length > 1 && /.+@.+\..+/.test(form.email) && form.message.trim().length > 10,
    [form],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        locale,
        source_path: window.location.pathname,
      };

      const { error } = await supabase.functions.invoke('submitDemoRequest', {
        body: payload,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setStatus({ type: 'success', message: t.success });
      setForm({
        full_name: '',
        email: '',
        company_name: '',
        role_label: roleOptions[0],
        message: '',
        website: '',
      });
    },
    onError: () => {
      setStatus({ type: 'error', message: t.error });
    },
  });

  return (
    <div className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell relative overflow-hidden px-6 pb-14 pt-28 md:pb-16 md:pt-36">
        <div className="pointer-events-none absolute left-[8%] top-20 h-64 w-64 rounded-full bg-[rgba(239,97,68,0.1)] blur-3xl" aria-hidden />
        <div className="max-w-7xl mx-auto text-center">
          <p className="public-eyebrow">{t.chip}</p>
          <h1 className={`${PUBLIC_CLASSES.displayH1} mt-6 max-w-[13ch] mx-auto`}>{t.title}</h1>
          <p className={`mt-5 max-w-3xl mx-auto ${PUBLIC_CLASSES.bodyLead}`}>{t.subtitle}</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-14 md:py-20 grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 space-y-4">
          <div className="public-grid-card p-6">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--public-accent-dark)] font-extrabold">{t.nextTitle}</p>
            <ul className="mt-4 space-y-3 text-[14px] text-[var(--public-muted)] leading-[1.65]">
              {t.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
          <div className="public-grid-card p-6">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--public-accent-dark)] font-extrabold">{t.resourcesTitle}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="ghost" className="public-outline-button rounded-full h-10 px-4 text-[13px] text-[var(--public-ink)]">
                <Link to={locale === 'en' ? '/en/blog' : '/blog'}>{t.readBlog}</Link>
              </Button>
              <Button asChild variant="ghost" className="public-outline-button rounded-full h-10 px-4 text-[13px] text-[var(--public-ink)]">
                <Link to={locale === 'en' ? '/en/faq' : '/faq'}>{t.faq}</Link>
              </Button>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-8">
          <Card className="public-grid-card border-[rgba(84,63,54,0.12)] bg-white">
            <CardHeader>
              <CardTitle className="text-[26px] leading-[1.2] tracking-[-0.03em] text-[var(--public-ink)]">{t.detailsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t.fields.fullName}</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                  placeholder={t.fields.fullName}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.fields.email}</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="name@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.fields.company}</Label>
                <Input
                  value={form.company_name}
                  onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))}
                  placeholder={t.fields.company}
                />
              </div>
              <div className="space-y-2">
                <Label>{t.fields.role}</Label>
                <select
                  className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm"
                  value={form.role_label}
                  onChange={(e) => setForm((p) => ({ ...p, role_label: e.target.value }))}
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-2">
                <Label>{t.fields.message}</Label>
                <Textarea
                  className="min-h-32"
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  placeholder={t.messagePlaceholder}
                />
              </div>
              <div className="hidden" aria-hidden="true">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  placeholder="Leave empty"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                <Button
                  className={`${PUBLIC_CLASSES.primaryCta} h-10 px-6 text-[13px]`}
                  onClick={() => mutation.mutate()}
                  disabled={!isValid || mutation.isPending}
                >
                  {mutation.isPending ? t.sending : t.submit}
                </Button>
                {status.type ? (
                  <p className={`text-sm ${status.type === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>{status.message}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#15171c] relative overflow-hidden">
        <div className="absolute top-0 left-[18%] w-96 h-96 bg-[rgba(239,97,68,0.18)] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-[14%] w-80 h-80 bg-[rgba(196,158,108,0.12)] rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className={`${PUBLIC_CLASSES.darkDisplayH2} max-w-[13ch] mx-auto`}>{t.finalTitle}</h2>
          <p className={`mt-6 ${PUBLIC_CLASSES.darkBodyLead}`}>{t.finalText}</p>
          <div className="mt-10 flex justify-center">
            <Button asChild className={PUBLIC_CLASSES.darkPrimaryCta}>
              <Link to={locale === 'en' ? '/en/blog' : '/blog'}>
                {t.finalCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/40">{t.finalNote}</p>
        </div>
      </section>
    </div>
  );
}
