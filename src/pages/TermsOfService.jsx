import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/components/i18n/useLanguage';

export default function TermsOfService() {
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tr('Termini e Condizioni di Servizio', 'Terms and Conditions of Service')}</h1>
          <p className="text-sm text-gray-500 mb-6">{tr('Ultimo aggiornamento: 17 febbraio 2026', 'Last updated: February 17, 2026')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('1. Descrizione del servizio', '1. Service description')}</h2>
          <p>{tr('EdilSync è una piattaforma digitale per la gestione di progetti edilizi che consente la collaborazione tra committenti, imprese, professionisti e consulenti. Il servizio include gestione di progetti, attività, documenti, messaggistica e calendario.', 'EdilSync is a digital platform for managing construction projects, enabling collaboration among clients, companies, professionals and consultants. The service includes project, task, document, messaging and calendar management.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('2. Accettazione dei termini', '2. Acceptance of terms')}</h2>
          <p>{tr('L\'accesso e l\'utilizzo di EdilSync comportano l\'accettazione integrale dei presenti Termini e Condizioni. Se non si accettano i termini, non è consentito utilizzare il servizio.', 'Accessing and using EdilSync implies full acceptance of these Terms and Conditions. If you do not accept these terms, you may not use the service.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('3. Registrazione e account', '3. Registration and account')}</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>{tr('L\'utente deve fornire informazioni veritiere e aggiornate', 'Users must provide truthful and updated information')}</li>
            <li>{tr('L\'utente è responsabile della riservatezza delle proprie credenziali', 'Users are responsible for credential confidentiality')}</li>
            <li>{tr('Ogni account è personale e non trasferibile', 'Each account is personal and non-transferable')}</li>
            <li>{tr('L\'utente è responsabile di tutte le attività svolte tramite il proprio account', 'Users are responsible for all activity performed through their account')}</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('4. Obblighi dell\'utente', '4. User obligations')}</h2>
          <p>{tr('L\'utente si impegna a:', 'Users agree to:')}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{tr('Utilizzare il servizio in conformità alla legge italiana e dell\'UE', 'Use the service in compliance with Italian and EU law')}</li>
            <li>{tr('Non caricare contenuti illeciti, diffamatori o lesivi di diritti altrui', 'Not upload illegal, defamatory or rights-infringing content')}</li>
            <li>{tr('Non tentare di accedere a dati o funzionalità non autorizzate', 'Not attempt unauthorized access to data or features')}</li>
            <li>{tr('Non utilizzare il servizio per scopi diversi dalla gestione di progetti edilizi', 'Not use the service for purposes other than construction project management')}</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('5. Proprietà intellettuale', '5. Intellectual property')}</h2>
          <p>{tr('Il software, il design, i loghi e tutti i contenuti di EdilSync sono protetti dal diritto d\'autore (L. 633/1941) e restano di proprietà esclusiva del titolare. L\'utente mantiene la proprietà dei propri contenuti caricati sulla piattaforma.', 'The software, design, logos and all EdilSync content are protected by copyright and remain the exclusive property of the owner. Users retain ownership of content uploaded to the platform.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('6. Contenuti dell\'utente', '6. User content')}</h2>
          <p>{tr('L\'utente concede a EdilSync una licenza limitata, non esclusiva, per ospitare, visualizzare e trasmettere i contenuti caricati al solo fine di erogare il servizio. I contenuti condivisi all\'interno di un progetto saranno visibili agli altri partecipanti del medesimo progetto.', 'Users grant EdilSync a limited, non-exclusive license to host, display and transmit uploaded content solely for service delivery. Content shared within a project is visible to other project participants.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('7. Limitazione di responsabilità', '7. Limitation of liability')}</h2>
          <p>{tr('EdilSync è fornito "così com\'è" (as is). Il titolare non garantisce che il servizio sia privo di errori o interruzioni. In nessun caso il titolare sarà responsabile per danni indiretti, incidentali o consequenziali derivanti dall\'uso del servizio.', 'EdilSync is provided "as is". The owner does not guarantee the service is error-free or uninterrupted. In no case shall the owner be liable for indirect, incidental, or consequential damages arising from service use.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('8. Sospensione e terminazione', '8. Suspension and termination')}</h2>
          <p>{tr('Il titolare si riserva il diritto di sospendere o terminare l\'accesso al servizio in caso di violazione dei presenti termini, senza preavviso. L\'utente può cancellare il proprio account in qualsiasi momento dalle impostazioni.', 'The owner reserves the right to suspend or terminate service access in case of terms violations, without prior notice. Users can delete their account at any time from settings.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('9. Legge applicabile e foro competente', '9. Applicable law and jurisdiction')}</h2>
          <p>{tr('I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia sarà competente il Foro di [sede legale], salvo diversa disposizione inderogabile di legge a tutela del consumatore.', 'These terms are governed by Italian law. Any dispute shall fall under the jurisdiction of the Court of [registered office], unless mandatory consumer protection rules provide otherwise.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('10. Modifiche', '10. Changes')}</h2>
          <p>{tr('Ci riserviamo il diritto di modificare i presenti termini. Le modifiche saranno comunicate tramite l\'applicazione con un preavviso ragionevole. L\'uso continuato del servizio dopo la modifica costituisce accettazione dei nuovi termini.', 'We reserve the right to modify these terms. Changes will be communicated through the application with reasonable notice. Continued use after changes implies acceptance of the updated terms.')}</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">{tr('11. Contatti', '11. Contacts')}</h2>
          <p>{tr('Per domande relative ai presenti termini, scrivere a:', 'For questions related to these terms, write to:')} <strong>info@edilsync.it</strong></p>
        </CardContent>
      </Card>
    </div>
  );
}