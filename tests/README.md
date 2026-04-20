# Test Guide

Questa e la guida operativa unica per avvio app e test manuali.

## Obiettivo

- tenere i test remoti sempre sul branch `qa`
- tenere `npm run dev` per l'app su main
- avere `npm run qa` per l'app puntata al branch `qa`
- evitare pipeline automatiche per ora

## Dove sta cosa

- `tests/scripts/`: script manuali per avvio app e test
- `tests/integration/`: test backend remoti contro `qa`
- `tests/e2e/`: browser test contro frontend locale + backend `qa`
- `public/Docs/qa/`: matrice scenari e backlog per layer
- `tests/reports/`: report HTML unificati per tutte le suite
- `tests/playwright-report/`: report HTML Playwright per sessione e suite
- `tests/test-results/`: artefatti Playwright per trace, screenshot e video

## Configurazione ambiente

Creare i file locali partendo dagli esempi:

- `.env.local` da `.env.example` per lavorare su main
- `.env.qa.local` da `.env.qa.example` per lavorare e testare su QA

Fallback accettati:

- `.env.local` / `.env`
- `.env.qa.local` / `.env.qa`

`.env.local` serve per `npm run dev`.

`.env.qa.local` serve per:

- avviare l'app contro `qa`
- test di integrazione remoti
- Playwright smoke/regression

I test remoti rifiutano l'esecuzione se `SUPABASE_URL` non punta al project ref QA `csjphzmyacnfmhllgqnq`.

## Avvio app

Avvio app contro `main`:

```bash
npm run dev
```

Avvio app contro `qa`:

```bash
npm run qa
```

## Comandi test

Unit test:

```bash
npm run test:unit
```

Tutti gli script di test caricano prima `nvm use 22.16.0` tramite `tests/scripts/ensure-node.sh`.

Integrazione remota backend su `qa`:

```bash
npm run test:integration:qa
```

Database pgTAP locale:

```bash
npm run test:db
```

Il comando avvia e ferma automaticamente Supabase locale se non e gia attivo.

Smoke browser su frontend locale + backend `qa`:

```bash
npm run test:e2e:smoke
```

E2E browser critici su frontend locale + backend `qa`:

```bash
npm run test:e2e
```

Questo comando ora esegue l'intera suite Playwright (`smoke`, `critical`, `regression`).

Per lanciare solo il pack critico:

```bash
npm run test:e2e:critical
```

Questo pack contiene i journey browser piu importanti lato utente, ad esempio:

- auth e persistenza sessione
- cambio contesto
- inviti societa
- inviti/duplicati partecipanti progetto
- notifiche con navigazione reale

Regression browser su frontend locale + backend `qa`:

```bash
npm run test:e2e:regression
```

Tutto il pacchetto manuale con riepilogo finale:

```bash
npm run test:all
```

`test:all` esegue:

- secret scan
- lint
- typecheck
- unit
- integrazione remota `qa`
- pgTAP locale
- Playwright smoke su `qa`
- Playwright critical su `qa`
- Playwright regression su `qa`

Se la config QA non e pronta, `test:all` lo segnala nel riepilogo finale e marca come `SKIP` i blocchi remoti dipendenti da `qa`.

Ogni esecuzione aggiorna anche il report HTML aggregato in `tests/reports/index.html`. Se la suite e browser-based, vengono salvati anche i dettagli Playwright e gli artefatti per sessione sotto `tests/playwright-report/` e `tests/test-results/`.

Controllo rapido config QA:

```bash
npm run test:doctor
```

## Script utili

- `tests/scripts/load-qa-env.sh`: carica `.env.qa.local` o `.env.qa` per i test remoti
- `tests/scripts/assert-qa-target.sh`: blocca test remoti se puntano a `main`
- `tests/scripts/run-all-tests.sh`: esegue tutto e stampa il riepilogo finale
- `tests/scripts/remote/`: utility manuali per sincronizzare il backend del branch `qa`

## Documentazione di copertura

Per la copertura business e i backlog operativi usare:

- `public/Docs/qa/README.md`
- `public/Docs/qa/scenario-matrix.md`
- `public/Docs/qa/vitest-backlog.md`
- `public/Docs/qa/integration-backlog.md`
- `public/Docs/qa/pgtap-backlog.md`
- `public/Docs/qa/playwright-backlog.md`

## Nota importante

In repo non ci sono piu workflow automatici per i test. Tutto il flusso QA e manuale e viene lanciato esplicitamente con gli script sopra.
