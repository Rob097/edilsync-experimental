import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Termini e Condizioni di Servizio</h1>
          <p className="text-sm text-gray-500 mb-6">Ultimo aggiornamento: 17 febbraio 2026</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1. Descrizione del servizio</h2>
          <p>EdilSync è una piattaforma digitale per la gestione di progetti edilizi che consente la collaborazione tra committenti, imprese, professionisti e consulenti. Il servizio include gestione di progetti, attività, documenti, messaggistica e calendario.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2. Accettazione dei termini</h2>
          <p>L'accesso e l'utilizzo di EdilSync comportano l'accettazione integrale dei presenti Termini e Condizioni. Se non si accettano i termini, non è consentito utilizzare il servizio.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">3. Registrazione e account</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>L'utente deve fornire informazioni veritiere e aggiornate</li>
            <li>L'utente è responsabile della riservatezza delle proprie credenziali</li>
            <li>Ogni account è personale e non trasferibile</li>
            <li>L'utente è responsabile di tutte le attività svolte tramite il proprio account</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">4. Obblighi dell'utente</h2>
          <p>L'utente si impegna a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Utilizzare il servizio in conformità alla legge italiana e dell'UE</li>
            <li>Non caricare contenuti illeciti, diffamatori o lesivi di diritti altrui</li>
            <li>Non tentare di accedere a dati o funzionalità non autorizzate</li>
            <li>Non utilizzare il servizio per scopi diversi dalla gestione di progetti edilizi</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">5. Proprietà intellettuale</h2>
          <p>Il software, il design, i loghi e tutti i contenuti di EdilSync sono protetti dal diritto d'autore (L. 633/1941) e restano di proprietà esclusiva del titolare. L'utente mantiene la proprietà dei propri contenuti caricati sulla piattaforma.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6. Contenuti dell'utente</h2>
          <p>L'utente concede a EdilSync una licenza limitata, non esclusiva, per ospitare, visualizzare e trasmettere i contenuti caricati al solo fine di erogare il servizio. I contenuti condivisi all'interno di un progetto saranno visibili agli altri partecipanti del medesimo progetto.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7. Limitazione di responsabilità</h2>
          <p>EdilSync è fornito "così com'è" (as is). Il titolare non garantisce che il servizio sia privo di errori o interruzioni. In nessun caso il titolare sarà responsabile per danni indiretti, incidentali o consequenziali derivanti dall'uso del servizio.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">8. Sospensione e terminazione</h2>
          <p>Il titolare si riserva il diritto di sospendere o terminare l'accesso al servizio in caso di violazione dei presenti termini, senza preavviso. L'utente può cancellare il proprio account in qualsiasi momento dalle impostazioni.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">9. Legge applicabile e foro competente</h2>
          <p>I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia sarà competente il Foro di [sede legale], salvo diversa disposizione inderogabile di legge a tutela del consumatore.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">10. Modifiche</h2>
          <p>Ci riserviamo il diritto di modificare i presenti termini. Le modifiche saranno comunicate tramite l'applicazione con un preavviso ragionevole. L'uso continuato del servizio dopo la modifica costituisce accettazione dei nuovi termini.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">11. Contatti</h2>
          <p>Per domande relative ai presenti termini, scrivere a: <strong>info@edilsync.it</strong></p>
        </CardContent>
      </Card>
    </div>
  );
}