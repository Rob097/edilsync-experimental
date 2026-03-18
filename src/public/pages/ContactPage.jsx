import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/api/appClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import usePublicSeo from '@/public/hooks/usePublicSeo';

const rolesByLocale = {
  it: [
    'Impresa / Contractor',
    'Committente',
    'Subappaltatore',
    'Tecnico / Progettista',
    'Altro',
  ],
  en: ['Contractor', 'Homeowner', 'Subcontractor', 'Technical professional', 'Other'],
};

const copy = {
  it: {
    title: 'Richiedi una demo EdilSync',
    subtitle:
      'Raccontaci il tuo contesto di cantiere. Ti ricontattiamo con una demo focalizzata su dispute, coordinamento e controllo operativo.',
    fields: {
      fullName: 'Nome e cognome',
      email: 'Email',
      company: 'Azienda (opzionale)',
      role: 'Ruolo',
      message: 'Messaggio',
    },
    submit: 'Invia richiesta',
    sending: 'Invio in corso...',
    success: 'Richiesta inviata. Ti contatteremo al piu presto.',
    error: 'Errore durante l invio. Riprova tra poco.',
  },
  en: {
    title: 'Request an EdilSync demo',
    subtitle:
      'Tell us about your project context. We will follow up with a demo focused on dispute prevention, coordination, and operational control.',
    fields: {
      fullName: 'Full name',
      email: 'Email',
      company: 'Company (optional)',
      role: 'Role',
      message: 'Message',
    },
    submit: 'Send request',
    sending: 'Sending...',
    success: 'Request sent. We will get back to you soon.',
    error: 'Unable to send request right now. Please try again shortly.',
  },
};

export default function ContactPage({ locale = 'it' }) {
  const t = copy[locale] || copy.it;
  const roleOptions = rolesByLocale[locale] || rolesByLocale.it;

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    company_name: '',
    role_label: roleOptions[0],
    message: '',
  });

  const [status, setStatus] = useState({ type: null, message: '' });

  usePublicSeo({
    title: locale === 'en' ? 'Contact and Demo Request' : 'Contatti e Demo',
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

      const { error } = await supabase.from('demo_requests').insert(payload);
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
          <p className="section-chip">{locale === 'en' ? 'Contact' : 'Contatti'}</p>
          <h1 className="mt-4 text-[42px] sm:text-[58px] font-[780] leading-[1.06] tracking-[-0.02em] text-[#141821]">{t.title}</h1>
          <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#5b6470] max-w-3xl mx-auto">{t.subtitle}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-18 grid gap-6 lg:grid-cols-12">
        <aside className="lg:col-span-4 space-y-4">
          <div className="public-panel bg-white p-6">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#ef6144] font-semibold">{locale === 'en' ? 'What happens next' : 'Cosa succede dopo'}</p>
            <ul className="mt-4 space-y-3 text-[14px] text-[#526071] leading-[1.65]">
              <li>{locale === 'en' ? '1. We review your request and context.' : '1. Analizziamo la tua richiesta e il contesto.'}</li>
              <li>{locale === 'en' ? '2. We book a focused alignment call.' : '2. Fissiamo una call di allineamento mirata.'}</li>
              <li>{locale === 'en' ? '3. We run a role-based live demo.' : '3. Eseguiamo una demo live orientata ai ruoli.'}</li>
            </ul>
          </div>
          <div className="public-panel bg-white p-6">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#ef6144] font-semibold">{locale === 'en' ? 'Need resources first?' : 'Vuoi prima approfondire?'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="ghost" className="rounded-full text-[#2f3b48] hover:bg-[#f8fafc] h-9 px-4 text-[13px]">
                <Link to={locale === 'en' ? '/en/blog' : '/blog'}>{locale === 'en' ? 'Read blog' : 'Leggi blog'}</Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-full text-[#2f3b48] hover:bg-[#f8fafc] h-9 px-4 text-[13px]">
                <Link to={locale === 'en' ? '/en/faq' : '/faq'}>FAQ</Link>
              </Button>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-8">
          <Card className="public-panel border-[#e2e8f0] bg-white">
            <CardHeader>
              <CardTitle className="text-[26px] leading-[1.2] text-[#141821]">{locale === 'en' ? 'Demo details' : 'Dettagli richiesta'}</CardTitle>
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
                  placeholder={locale === 'en' ? 'Tell us about your current workflow and challenges...' : 'Descrivi flusso attuale e criticita principali...'}
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

      <section className="border-y border-[#e8edf3] bg-[#0b1220] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,97,68,0.25),transparent_50%)]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 className="text-[34px] sm:text-[48px] font-[780] leading-[1.1] tracking-[-0.018em] max-w-4xl mx-auto">
            {locale === 'en' ? 'Need immediate support before the demo?' : 'Serve supporto immediato prima della demo?'}
          </h2>
          <p className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#d8e1eb] max-w-3xl mx-auto">
            {locale === 'en'
              ? 'Write to us and we will guide you on the best starting point for your project context.'
              : 'Scrivici e ti orientiamo sul punto di partenza migliore per il tuo contesto di cantiere.'}
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline" className="border-[#334155] text-white bg-transparent rounded-full h-10 px-5 text-[13px] font-medium hover:bg-[#1e293b]">
              <Link to={locale === 'en' ? '/en/blog' : '/blog'}>{locale === 'en' ? 'Open resources' : 'Apri risorse'}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
