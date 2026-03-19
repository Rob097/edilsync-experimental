import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function CookiePolicy() {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  return (
    <div className="bg-[#f2f4f6] min-h-screen">
      <section className="relative overflow-hidden public-gradient border-b border-[#e5e7eb]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-18 pb-10 text-center">
          <p className="section-chip">Legal</p>
          <h1 className="mt-4 text-[38px] sm:text-[50px] font-[780] leading-[1.08] tracking-[-0.02em] text-[#141821]">{tr('Cookie Policy', 'Cookie Policy')}</h1>
          <p className="mt-4 text-[14px] text-[#5b6470]">{tr('Ultimo aggiornamento: 17 febbraio 2026', 'Last updated: February 17, 2026')}</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      <Card className="public-panel bg-white border-[#e2e8f0]">
        <CardContent className="prose prose-sm max-w-none p-6 sm:p-10 prose-headings:text-[#0f172a] prose-p:text-[#526071] prose-li:text-[#526071]">
          <p className="text-sm text-gray-500 mb-6">{tr('Questa policy spiega come usiamo i cookie per il funzionamento e il miglioramento del servizio.', 'This policy explains how cookies are used for service operation and improvement.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('1. Cosa sono i cookie', '1. What cookies are')}</h2>
          <p>{tr('I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell\'utente durante la navigazione. Vengono utilizzati per migliorare l\'esperienza di utilizzo e per il funzionamento del servizio.', 'Cookies are small text files stored on the user\'s device while browsing. They are used to improve user experience and enable service operation.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('2. Tipologie di cookie utilizzati', '2. Types of cookies used')}</h2>
          
          <h3 className="text-base font-semibold mt-4 mb-1">{tr('Cookie tecnici (necessari)', 'Technical cookies (necessary)')}</h3>
          <p>{tr('Questi cookie sono essenziali per il funzionamento dell\'applicazione e non possono essere disattivati. Includono:', 'These cookies are essential for the app to function and cannot be disabled. They include:')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>{tr('Cookie di sessione:', 'Session cookies:')}</strong> {tr('mantengono l\'autenticazione dell\'utente', 'maintain user authentication')}</li>
            <li><strong>{tr('Cookie di preferenza:', 'Preference cookies:')}</strong> {tr('memorizzano le impostazioni dell\'utente (es. contesto attivo)', 'store user settings (e.g. active context)')}</li>
          </ul>
          <p><em>{tr('Base giuridica:', 'Legal basis:')}</em> {tr('legittimo interesse (Art. 6.1.f GDPR) — necessari per l\'erogazione del servizio.', 'legitimate interest (Art. 6.1.f GDPR) — necessary for service delivery.')}</p>

          <h3 className="text-base font-semibold mt-4 mb-1">{tr('Cookie analitici', 'Analytics cookies')}</h3>
          <p>{tr('Utilizziamo cookie analitici per comprendere come gli utenti interagiscono con l\'applicazione e migliorare il servizio. Questi cookie raccolgono informazioni in forma aggregata e anonima.', 'We use analytics cookies to understand how users interact with the application and improve the service. These cookies collect aggregated and anonymous information.')}</p>
          <p><em>{tr('Base giuridica:', 'Legal basis:')}</em> {tr('consenso dell\'utente (Art. 6.1.a GDPR).', 'user consent (Art. 6.1.a GDPR).')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('3. Cookie di terze parti', '3. Third-party cookies')}</h2>
          <p>{tr('L\'applicazione potrebbe includere servizi di terze parti che impostano i propri cookie. EdilSync non ha controllo su questi cookie. Si invita a consultare le rispettive informative.', 'The app may include third-party services that set their own cookies. EdilSync has no control over those cookies. Please refer to the respective policies.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('4. Gestione dei cookie', '4. Cookie management')}</h2>
          <p>{tr('L\'utente può gestire le preferenze sui cookie tramite:', 'Users can manage cookie preferences through:')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{tr('Il banner cookie mostrato al primo accesso', 'The cookie banner shown at first access')}</li>
            <li>{tr('Le impostazioni del proprio browser', 'Browser settings')}</li>
          </ul>
          <p>{tr('La disattivazione dei cookie tecnici potrebbe compromettere il funzionamento dell\'applicazione.', 'Disabling technical cookies may affect application functionality.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('5. Durata dei cookie', '5. Cookie duration')}</h2>
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">{tr('Tipo', 'Type')}</th>
                <th className="text-left py-2">{tr('Durata', 'Duration')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4">{tr('Cookie di sessione', 'Session cookies')}</td>
                <td className="py-2">{tr('Fino alla chiusura del browser', 'Until browser is closed')}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">{tr('Cookie di preferenza', 'Preference cookies')}</td>
                <td className="py-2">{tr('12 mesi', '12 months')}</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">{tr('Cookie analitici', 'Analytics cookies')}</td>
                <td className="py-2">{tr('24 mesi', '24 months')}</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('6. Diritti dell\'utente', '6. User rights')}</h2>
          <p>{tr('Per maggiori informazioni sui diritti relativi al trattamento dei dati, consultare la nostra', 'For more information on data-processing rights, see our')} <a href="/privacy" className="text-[#ef6144] hover:underline">{tr('Informativa sulla Privacy', 'Privacy Policy')}</a>.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('7. Contatti', '7. Contacts')}</h2>
          <p>{tr('Per domande relative ai cookie, scrivere a:', 'For cookie-related questions, write to:')} <strong>info@rdlabs.digital</strong></p>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}