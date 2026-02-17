import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function CookiePolicy() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
          <p className="text-sm text-gray-500 mb-6">Ultimo aggiornamento: 17 febbraio 2026</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1. Cosa sono i cookie</h2>
          <p>I cookie sono piccoli file di testo che vengono memorizzati sul dispositivo dell'utente durante la navigazione. Vengono utilizzati per migliorare l'esperienza di utilizzo e per il funzionamento del servizio.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2. Tipologie di cookie utilizzati</h2>
          
          <h3 className="text-base font-semibold mt-4 mb-1">Cookie tecnici (necessari)</h3>
          <p>Questi cookie sono essenziali per il funzionamento dell'applicazione e non possono essere disattivati. Includono:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Cookie di sessione:</strong> mantengono l'autenticazione dell'utente</li>
            <li><strong>Cookie di preferenza:</strong> memorizzano le impostazioni dell'utente (es. contesto attivo)</li>
          </ul>
          <p><em>Base giuridica:</em> legittimo interesse (Art. 6.1.f GDPR) — necessari per l'erogazione del servizio.</p>

          <h3 className="text-base font-semibold mt-4 mb-1">Cookie analitici</h3>
          <p>Utilizziamo cookie analitici per comprendere come gli utenti interagiscono con l'applicazione e migliorare il servizio. Questi cookie raccolgono informazioni in forma aggregata e anonima.</p>
          <p><em>Base giuridica:</em> consenso dell'utente (Art. 6.1.a GDPR).</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">3. Cookie di terze parti</h2>
          <p>L'applicazione potrebbe includere servizi di terze parti che impostano i propri cookie. EdilSync non ha controllo su questi cookie. Si invita a consultare le rispettive informative.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">4. Gestione dei cookie</h2>
          <p>L'utente può gestire le preferenze sui cookie tramite:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Il banner cookie mostrato al primo accesso</li>
            <li>Le impostazioni del proprio browser</li>
          </ul>
          <p>La disattivazione dei cookie tecnici potrebbe compromettere il funzionamento dell'applicazione.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">5. Durata dei cookie</h2>
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 pr-4">Tipo</th>
                <th className="text-left py-2">Durata</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 pr-4">Cookie di sessione</td>
                <td className="py-2">Fino alla chiusura del browser</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Cookie di preferenza</td>
                <td className="py-2">12 mesi</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 pr-4">Cookie analitici</td>
                <td className="py-2">24 mesi</td>
              </tr>
            </tbody>
          </table>

          <h2 className="text-lg font-semibold mt-6 mb-2">6. Diritti dell'utente</h2>
          <p>Per maggiori informazioni sui diritti relativi al trattamento dei dati, consultare la nostra <a href="/PrivacyPolicy" className="text-[#ef6144] hover:underline">Informativa sulla Privacy</a>.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7. Contatti</h2>
          <p>Per domande relative ai cookie, scrivere a: <strong>privacy@edilsync.it</strong></p>
        </CardContent>
      </Card>
    </div>
  );
}