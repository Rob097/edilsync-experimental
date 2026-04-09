import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/components/i18n/useLanguage';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import { localizePublicPath } from '@/public/lib/localePath';

export default function PrivacyPolicy() {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const title = tr('Informativa sulla Privacy', 'Privacy Policy');
  const description = tr(
    'Informativa sul trattamento dei dati personali per la piattaforma EdilSync.',
    'Privacy policy describing how personal data is processed on EdilSync.',
  );
  const cookiePolicyPath = localizePublicPath('/cookie', location.pathname);

  usePublicSeo({
    title,
    description,
    canonicalPath: currentLanguage === 'en' ? '/en/privacy' : '/privacy',
    locale: currentLanguage,
    alternateItPath: '/privacy',
    alternateEnPath: '/en/privacy',
  });

  return (
    <div className="bg-[#f2f4f6] min-h-screen">
      <section className="relative overflow-hidden public-gradient border-b border-[#e5e7eb]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-[4.5rem] pb-10 text-center">
          <p className="section-chip">Legal</p>
          <h1 className="mt-4 text-[38px] sm:text-[50px] font-[780] leading-[1.08] tracking-[-0.02em] text-[#141821]">{tr('Informativa sulla Privacy', 'Privacy Policy')}</h1>
          <p className="mt-4 text-[14px] text-[#5b6470]">{tr('Ultimo aggiornamento: 17 febbraio 2026', 'Last updated: February 17, 2026')}</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <Card className="public-panel bg-white border-[#e2e8f0]">
        <CardContent className="prose prose-sm max-w-none p-6 sm:p-10 prose-headings:text-[#0f172a] prose-p:text-[#526071] prose-li:text-[#526071]">
          <p className="text-sm text-gray-500 mb-6">{tr('Questa informativa descrive come trattiamo i dati personali sulla piattaforma EdilSync.', 'This policy explains how personal data is processed on EdilSync.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('1. Titolare del trattamento', '1. Data controller')}</h2>
          <p>{tr('Il titolare del trattamento dei dati personali è EdilSync, raggiungibile all\'indirizzo email:', 'The controller of personal data is EdilSync, reachable at:')} <strong>info@rdlabs.digital</strong>.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('2. Dati raccolti', '2. Data collected')}</h2>
          <p>{tr('Raccogliamo le seguenti categorie di dati personali:', 'We collect the following categories of personal data:')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{tr('Dati identificativi:', 'Identification data:')}</strong> {tr('nome, cognome, indirizzo email', 'name, surname, email address')}</li>
            <li><strong>{tr('Dati aziendali:', 'Company data:')}</strong> {tr('ragione sociale, P.IVA, indirizzo sede, telefono', 'company name, VAT number, office address, phone')}</li>
            <li><strong>{tr('Dati di utilizzo:', 'Usage data:')}</strong> {tr('log di accesso, interazioni con l\'applicazione', 'access logs, interactions with the application')}</li>
            <li><strong>{tr('Dati di cantiere:', 'Worksite data:')}</strong> {tr('documenti, foto, messaggi caricati dall\'utente', 'documents, photos, messages uploaded by the user')}</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('3. Finalità e base giuridica', '3. Purposes and legal basis')}</h2>
          <p>{tr('I dati sono trattati per le seguenti finalità:', 'Data is processed for the following purposes:')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{tr('Esecuzione del contratto', 'Contract performance')}</strong> (Art. 6.1.b GDPR): {tr('registrazione, gestione account, erogazione del servizio', 'registration, account management, service delivery')}</li>
            <li><strong>{tr('Legittimo interesse', 'Legitimate interest')}</strong> (Art. 6.1.f GDPR): {tr('sicurezza, prevenzione frodi, miglioramento del servizio', 'security, fraud prevention, service improvement')}</li>
            <li><strong>{tr('Consenso', 'Consent')}</strong> (Art. 6.1.a GDPR): {tr('invio di comunicazioni promozionali (se attivato)', 'sending promotional communications (if enabled)')}</li>
            <li><strong>{tr('Obbligo legale', 'Legal obligation')}</strong> (Art. 6.1.c GDPR): {tr('adempimenti fiscali e contabili', 'tax and accounting obligations')}</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('4. Conservazione dei dati', '4. Data retention')}</h2>
          <p>{tr('I dati personali sono conservati per tutta la durata del rapporto contrattuale e per i successivi 10 anni per adempimenti fiscali e legali. I dati di utilizzo sono conservati per 24 mesi.', 'Personal data is retained for the duration of the contractual relationship and for the following 10 years for fiscal and legal compliance. Usage data is retained for 24 months.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('5. Condivisione dei dati', '5. Data sharing')}</h2>
          <p>{tr('I dati possono essere condivisi con:', 'Data may be shared with:')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{tr('Altri partecipanti al cantiere (nome, email, ruolo) — necessario per il funzionamento del servizio', 'Other worksite participants (name, email, role) — necessary for service operation')}</li>
            <li>{tr('Fornitori di servizi tecnici (hosting, email) — in qualità di responsabili del trattamento', 'Technical service providers (hosting, email) — as processors')}</li>
          </ul>
          <p>{tr('I dati non vengono venduti a terzi.', 'Data is not sold to third parties.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('6. Diritti dell\'interessato', '6. Data subject rights')}</h2>
          <p>{tr('Ai sensi degli articoli 15-22 del GDPR, l\'utente ha diritto di:', 'Under Articles 15-22 GDPR, users have the right to:')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{tr('Accedere ai propri dati personali', 'Access personal data')}</li>
            <li>{tr('Rettificare dati inesatti', 'Rectify inaccurate data')}</li>
            <li>{tr('Cancellare i propri dati ("diritto all\'oblio")', 'Delete personal data ("right to be forgotten")')}</li>
            <li>{tr('Limitare il trattamento', 'Restrict processing')}</li>
            <li>{tr('Portabilità dei dati', 'Data portability')}</li>
            <li>{tr('Opporsi al trattamento', 'Object to processing')}</li>
            <li>{tr('Revocare il consenso in qualsiasi momento', 'Withdraw consent at any time')}</li>
            <li>{tr('Proporre reclamo al Garante per la Protezione dei Dati Personali', 'Lodge a complaint with the Data Protection Authority')}</li>
          </ul>
          <p>{tr('Per esercitare i propri diritti, scrivere a:', 'To exercise your rights, write to:')} <strong>info@rdlabs.digital</strong></p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('7. Cookie', '7. Cookies')}</h2>
          <p>{tr('Per informazioni sull\'utilizzo dei cookie, consultare la nostra', 'For information about cookie usage, see our')} <Link to={cookiePolicyPath} className="text-[#ef6144] hover:underline">Cookie Policy</Link>.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('8. Modifiche', '8. Changes')}</h2>
          <p>{tr('Ci riserviamo il diritto di aggiornare questa informativa. Eventuali modifiche saranno comunicate tramite l\'applicazione.', 'We reserve the right to update this policy. Any changes will be communicated through the application.')}</p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}