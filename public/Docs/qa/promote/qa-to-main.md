# QA to Main Promotion Runbook

Questa procedura serve quando il commit gia validato in QA e gia arrivato su GitHub `main`, il deploy frontend e gia andato a buon fine, e va promosso anche il branch Supabase `qa` nel branch protetto `main`.

## Obiettivo

- promuovere il backend Supabase da `qa` a `main` in modo ripetibile
- intercettare prima i casi che fanno fallire il merge branch-to-branch
- lasciare anche il branch `qa` riallineato a `main` dopo la promozione

## Strumenti canonici

- `npm run supabase:promote:precheck`
- `npm run supabase:promote:repair-history`
- Copilot con MCP Supabase per `merge_branch` e `rebase_branch`

Nota importante: la Supabase CLI del repo puo elencare branch e funzioni, ma non espone merge e rebase dei branch. Per quello usare Copilot con MCP oppure la dashboard Supabase Branching.

## Prerequisiti

Prima di promuovere QA in produzione devono essere veri tutti questi punti:

1. Il commit candidato e gia su GitHub `main`.
2. Il deploy Cloudflare Pages collegato a `main` e verde.
3. I test QA rilevanti per la modifica sono gia passati.
4. Il repo locale contiene le migration e le edge functions che rappresentano lo stato da promuovere.
5. La CLI Supabase e autenticata.

## Ordine operativo

### 1. Eseguire il precheck

Lanciare:

```bash
npm run supabase:promote:precheck
```

Il precheck controlla in ordine:

- stato dei branch Supabase `main` e `qa`
- allineamento `supabase/config.toml` -> progetto produzione
- match tra `supabase/migrations` locali e `schema_migrations` del progetto linked
- match tra edge functions locali e edge functions del branch `qa`
- differenze residue QA vs produzione su slug funzioni e `verify_jwt`

Interpretazione:

- Se fallisce su branch health: fermarsi. Non promuovere finche `main` e `qa` non tornano stabili.
- Se fallisce su migration history: eseguire lo step 2, poi rilanciare il precheck.
- Se fallisce su mismatch local vs QA delle funzioni: fermarsi e riallineare repo e QA prima del merge.
- Se mostra warning su funzioni solo in produzione: fare review manuale. Non e automaticamente un blocco, ma significa che esistono elementi fuori dal perimetro della promozione QA -> main.

### 2. Riparare la history migrazioni solo se serve

Se il precheck segnala che `schema_migrations` in produzione non coincide con le migration locali, lanciare:

```bash
npm run supabase:promote:repair-history
```

Questo script:

- non applica DDL nuovo
- non tocca lo schema applicativo
- riallinea solo la tabella `supabase_migrations.schema_migrations` del progetto linked alle migration locali

Subito dopo, rilanciare sempre:

```bash
npm run supabase:promote:precheck
```

Se il precheck non passa, non andare avanti col merge.

### 3. Promuovere il branch Supabase QA in main

Percorso preferito: chiedere a Copilot di usare l MCP Supabase.

Prompt consigliato:

```text
Promuovi il branch Supabase qa in main, poi ribasa qa su main e verifica lo stato finale dei branch e delle edge functions.
```

Percorso alternativo: dashboard Supabase Branching.

Ordine richiesto:

1. Merge del branch `qa` nel branch `main`
2. Attendere che `main` torni in stato sano
3. Rebase del branch `qa` su `main`
4. Attendere che anche `qa` torni in stato sano

Non saltare il rebase finale di `qa`, altrimenti il branch di test resta indietro o con stato degradato.

### 4. Verifiche post-promozione

Al termine della promozione eseguire di nuovo:

```bash
npm run supabase:promote:precheck
```

Esito atteso:

- `main` in `FUNCTIONS_DEPLOYED`
- `qa` in `FUNCTIONS_DEPLOYED` oppure `MIGRATIONS_PASSED`
- nessun drift tra migration locali e `schema_migrations` del progetto linked
- nessun mismatch tra funzioni locali e QA
- nessuna funzione QA ancora "pending promotion" verso produzione

Poi completare questi controlli manuali:

1. Verifica dei secret runtime lato produzione se la release tocca integrazioni esterne.
2. Smoke test minimo in produzione sui flussi toccati.
3. Review di eventuali funzioni rimaste solo in produzione e non nel set QA/repo.

## Caso noto gia visto in questo repo

Se il merge QA -> main fallisce con errori tipo:

- `trigger "trg_users_audit" already exists`
- tentativo di rieseguire la migration iniziale su oggetti gia presenti

la causa probabile non e uno schema rotto, ma drift della history migrazioni del branch protetto rispetto ai filename in `supabase/migrations`.

In quel caso la sequenza corretta e:

1. `npm run supabase:promote:precheck`
2. `npm run supabase:promote:repair-history`
3. `npm run supabase:promote:precheck`
4. merge `qa` -> `main`
5. rebase `qa` -> `main`

## Dove vivere con questa procedura

Questa e la fonte canonica per la promozione backend QA -> produzione.

Se il flusso cambia, aggiornare insieme:

- questo documento
- `tests/scripts/remote/precheck-promote-qa-to-main.sh`
- `tests/scripts/remote/repair-linked-migration-history.sh`