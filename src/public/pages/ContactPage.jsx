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
    <div className="bg-[#f2f4f6]">
      <section className="relative overflow-hidden public-gradient border-b border-[#e5e7eb]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-14 text-center">
          <p className="section-chip">{t.chip}</p>
          <h1 className="mt-4 text-[42px] sm:text-[58px] font-[780] leading-[1.06] tracking-[-0.02em] text-[#141821]">{t.title}</h1>
          <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#5b6470] max-w-3xl mx-auto">{t.subtitle}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18 grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 space-y-4">
          <div className="public-panel bg-white p-6">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#ef6144] font-semibold">{t.nextTitle}</p>
            <ul className="mt-4 space-y-3 text-[14px] text-[#526071] leading-[1.65]">
              {t.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
          <div className="public-panel bg-white p-6">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#ef6144] font-semibold">{t.resourcesTitle}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="ghost" className="rounded-full text-[#2f3b48] hover:bg-[#f8fafc] h-9 px-4 text-[13px]">
                <Link to={locale === 'en' ? '/en/blog' : '/blog'}>{t.readBlog}</Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-full text-[#2f3b48] hover:bg-[#f8fafc] h-9 px-4 text-[13px]">
                <Link to={locale === 'en' ? '/en/faq' : '/faq'}>{t.faq}</Link>
              </Button>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-8">
          <Card className="public-panel border-[#e2e8f0] bg-white">
            <CardHeader>
              <CardTitle className="text-[26px] leading-[1.2] text-[#141821]">{t.detailsTitle}</CardTitle>
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
                  className="bg-[#ef6144] hover:bg-[#d9553a] text-white rounded-full h-10 px-6 text-[13px] font-semibold shadow-[0_10px_28px_rgba(239,97,68,0.28)]"
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

      <section className="py-24 md:py-32 bg-[#0b1220] relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#ef6144]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className={PUBLIC_CLASSES.darkDisplayH2}>{t.finalTitle}</h2>
          <p className={`mt-6 ${PUBLIC_CLASSES.darkBodyLead}`}>{t.finalText}</p>
          <div className="mt-10 flex justify-center">
            <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white h-10 rounded-full px-10 text-base gap-2 shadow-lg shadow-[rgba(239,97,68,0.4)]">
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
