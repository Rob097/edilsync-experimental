import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardContent className="prose prose-sm max-w-none p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Informativa sulla Privacy</h1>
          <p className="text-sm text-gray-500 mb-6">Ultimo aggiornamento: 17 febbraio 2026</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">1. Titolare del trattamento</h2>
          <p>Il titolare del trattamento dei dati personali è EdilSync, raggiungibile all'indirizzo email: <strong>privacy@edilsync.it</strong>.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">2. Dati raccolti</h2>
          <p>Raccogliamo le seguenti categorie di dati personali:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dati identificativi:</strong> nome, cognome, indirizzo email</li>
            <li><strong>Dati aziendali:</strong> ragione sociale, P.IVA, indirizzo sede, telefono</li>
            <li><strong>Dati di utilizzo:</strong> log di accesso, interazioni con l'applicazione</li>
            <li><strong>Dati di progetto:</strong> documenti, foto, messaggi caricati dall'utente</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">3. Finalità e base giuridica</h2>
          <p>I dati sono trattati per le seguenti finalità:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Esecuzione del contratto</strong> (Art. 6.1.b GDPR): registrazione, gestione account, erogazione del servizio</li>
            <li><strong>Legittimo interesse</strong> (Art. 6.1.f GDPR): sicurezza, prevenzione frodi, miglioramento del servizio</li>
            <li><strong>Consenso</strong> (Art. 6.1.a GDPR): invio di comunicazioni promozionali (se attivato)</li>
            <li><strong>Obbligo legale</strong> (Art. 6.1.c GDPR): adempimenti fiscali e contabili</li>
          </ul>

          <h2 className="text-lg font-semibold mt-6 mb-2">4. Conservazione dei dati</h2>
          <p>I dati personali sono conservati per tutta la durata del rapporto contrattuale e per i successivi 10 anni per adempimenti fiscali e legali. I dati di utilizzo sono conservati per 24 mesi.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">5. Condivisione dei dati</h2>
          <p>I dati possono essere condivisi con:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Altri partecipanti al progetto (nome, email, ruolo) — necessario per il funzionamento del servizio</li>
            <li>Fornitori di servizi tecnici (hosting, email) — in qualità di responsabili del trattamento</li>
          </ul>
          <p>I dati non vengono venduti a terzi.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">6. Diritti dell'interessato</h2>
          <p>Ai sensi degli articoli 15-22 del GDPR, l'utente ha diritto di:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Accedere ai propri dati personali</li>
            <li>Rettificare dati inesatti</li>
            <li>Cancellare i propri dati ("diritto all'oblio")</li>
            <li>Limitare il trattamento</li>
            <li>Portabilità dei dati</li>
            <li>Opporsi al trattamento</li>
            <li>Revocare il consenso in qualsiasi momento</li>
            <li>Proporre reclamo al Garante per la Protezione dei Dati Personali</li>
          </ul>
          <p>Per esercitare i propri diritti, scrivere a: <strong>privacy@edilsync.it</strong></p>

          <h2 className="text-lg font-semibold mt-6 mb-2">7. Cookie</h2>
          <p>Per informazioni sull'utilizzo dei cookie, consultare la nostra <a href="/CookiePolicy" className="text-[#ef6144] hover:underline">Cookie Policy</a>.</p>

          <h2 className="text-lg font-semibold mt-6 mb-2">8. Modifiche</h2>
          <p>Ci riserviamo il diritto di aggiornare questa informativa. Eventuali modifiche saranno comunicate tramite l'applicazione.</p>
        </CardContent>
      </Card>
    </div>
  );
}