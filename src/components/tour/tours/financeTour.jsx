export const getFinanceSectionTour = (language = 'it', permissionScope = 'manager') => {
  const filterSteps = (steps) => steps.filter((step) => {
    if (permissionScope === 'viewer') {
      return step.target !== '[data-tour="finance-settings-card"]' && step.target !== '[data-tour="finance-rates-card"]';
    }

    if (permissionScope === 'contributor') {
      return step.target !== '[data-tour="finance-settings-card"]';
    }

    return true;
  });

  if (language === 'it') {
    return {
      id: 'finance_section_help',
      steps: filterSteps([
        {
          target: null,
          title: 'Benvenuto in Economia di commessa',
          content: 'Questa guida mostra come leggere i dati economici e dove intervenire per budget, costi, tariffe e SAL.',
          placement: 'center',
        },
        {
          target: '#section-finance',
          title: 'Economia di commessa',
          content: 'Questa sezione ti aiuta a controllare budget, consuntivi e SAL del cantiere in un unico punto.',
          placement: 'top',
        },
        {
          target: '[data-tour="finance-sal-report"]',
          title: 'Mini report SAL',
          content: 'Qui trovi un riepilogo rapido dei SAL: numero documenti, maturato, anticipi e da pagare.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="finance-kpi-row"]',
          title: 'KPI economici',
          content: 'I KPI mostrano budget pianificato, costi registrati, manodopera derivata da timbrature e forecast.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="finance-budget-card"]',
          title: 'Budget per voci',
          content: 'Qui imposti il preventivo analitico del cantiere: categoria, importi e società responsabile.',
          placement: 'top',
        },
        {
          target: '[data-tour="finance-costs-card"]',
          title: 'Consuntivi',
          content: 'Qui registri i costi reali maturati nel tempo, per confrontarli col budget.',
          placement: 'top',
        },
        {
          target: '[data-tour="finance-rates-card"]',
          title: 'Tariffe manodopera',
          content: 'Imposti i costi orari e puoi sincronizzare le timbrature in costi consuntivi.',
          placement: 'top',
        },
        {
          target: '[data-tour="finance-settings-card"]',
          title: 'Impostazioni economiche',
          content: 'Configura modalità budget, visibilità, metodo manodopera e gestione SAL.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="finance-progress-card"]',
          title: 'Stati Avanzamento (SAL)',
          content: 'Crea e approva i SAL per tracciare maturato e importi da pagare. Il progressivo è assegnato automaticamente.',
          placement: 'top',
        },
        {
          target: null,
          title: 'Hai completato la panoramica',
          content: 'Da qui puoi usare le guide con icona ? su ogni card per un dettaglio campo-per-campo.',
          placement: 'center',
        },
      ]),
    };
  }

  return {
    id: 'finance_section_help',
    steps: filterSteps([
      {
        target: null,
        title: 'Welcome to worksite finance',
        content: 'This guide explains how to read and operate budget, actual costs, rates, and progress statements.',
        placement: 'center',
      },
      {
        target: '#section-finance',
        title: 'Worksite finance',
        content: 'This section helps you control budget, actuals, and progress statements in one place.',
        placement: 'top',
      },
      {
        target: '[data-tour="finance-sal-report"]',
        title: 'Progress statement mini report',
        content: 'Quick summary of statements: count, matured amount, advances, and amount to pay.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="finance-kpi-row"]',
        title: 'Finance KPIs',
        content: 'KPIs show planned budget, recorded actuals, labor derived from work sessions, and forecast.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="finance-budget-card"]',
        title: 'Budget lines',
        content: 'Set the worksite estimate by categories, amounts, and responsible company.',
        placement: 'top',
      },
      {
        target: '[data-tour="finance-costs-card"]',
        title: 'Cost entries',
        content: 'Record actual costs over time to compare against your budget.',
        placement: 'top',
      },
      {
        target: '[data-tour="finance-rates-card"]',
        title: 'Labor rates',
        content: 'Set hourly labor rates and sync work sessions into actual costs.',
        placement: 'top',
      },
      {
        target: '[data-tour="finance-settings-card"]',
        title: 'Financial settings',
        content: 'Configure budget mode, visibility, labor method, and progress statements.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="finance-progress-card"]',
        title: 'Progress statements',
        content: 'Create and approve progress statements to track matured and payable amounts. The statement sequence is assigned automatically.',
        placement: 'top',
      },
      {
        target: null,
        title: 'Overview complete',
        content: 'Use the ? icon on each card to launch an in-depth field-by-field walkthrough.',
        placement: 'center',
      },
    ]),
  };
};

export const getFinanceCardTour = (language = 'it', card = 'settings') => {
  if (language === 'it') {
    const map = {
      kpi: {
        id: 'finance_card_help_kpi',
        steps: [
          { target: null, title: 'Guida KPI economici', content: 'Vediamo come leggere i principali indicatori in alto.', placement: 'center' },
          { target: '[data-tour="finance-kpi-row"]', title: 'Obiettivo della card', content: 'I KPI danno una fotografia rapida della salute economica della commessa.', placement: 'bottom' },
          { target: '[data-tour="finance-kpi-budget"]', title: 'Budget pianificato', content: 'Somma delle voci preventivate: è il valore target del cantiere.', placement: 'bottom' },
          { target: '[data-tour="finance-kpi-actual"]', title: 'Consuntivo registrato', content: 'Totale dei costi già contabilizzati: mostra quanto hai già speso.', placement: 'bottom' },
          { target: '[data-tour="finance-kpi-labor"]', title: 'Consuntivo manodopera', content: 'Costo manodopera calcolato dal metodo attivo: da timbrature o da inserimenti manuali.', placement: 'bottom' },
          { target: '[data-tour="finance-kpi-forecast"]', title: 'Forecast finale', content: 'Stima finale economica: combina costi registrati e residuo preventivo.', placement: 'bottom' },
          { target: '[data-tour="finance-sal-report"]', title: 'Report SAL', content: 'Mostra quanti SAL sono emessi, quanti approvati e l\'importo complessivo da pagare.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Usa questi numeri per individuare scostamenti prima di agire su budget o consuntivi.', placement: 'center' },
        ],
      },
      settings: {
        id: 'finance_card_help_settings',
        steps: [
          { target: null, title: 'Guida Impostazioni economiche', content: 'Questa card definisce le regole con cui il cantiere interpreta i dati economici.', placement: 'center' },
          { target: '[data-tour="finance-settings-card"]', title: 'Panoramica', content: 'Le impostazioni qui sopra cambiano il comportamento e la lettura dei dati economici.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-budget-mode"]', title: 'Modalità budget', content: 'Scegli il livello di dettaglio del preventivo: semplice o analitico per codici.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-visibility"]', title: 'Visibilità', content: 'Decidi se i dati economici sono visibili all’intero cantiere o per società.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-labor-method"]', title: 'Metodo manodopera', content: 'Puoi inserire costi manuali o derivarli dalle timbrature.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-sal-toggle"]', title: 'Abilitazione SAL', content: 'Attiva o disattiva la gestione SAL nel cantiere.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-badges"]', title: 'Badge di riepilogo', content: 'Qui vedi rapidamente le impostazioni attive prima di salvare.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Imposta bene questa card una volta: tutto il modulo finanza sarà più coerente.', placement: 'center' },
        ],
      },
      budget: {
        id: 'finance_card_help_budget',
        steps: [
          { target: null, title: 'Guida Budget per voci', content: 'Questa card gestisce il preventivo della commessa.', placement: 'center' },
          { target: '[data-tour="finance-budget-form"]', title: 'Inserimento voci', content: 'Compila titolo, categoria, importo e società responsabile per ogni voce.', placement: 'bottom' },
          { target: '[data-tour="finance-budget-list"]', title: 'Lista budget', content: 'Controlla tutte le voci già inserite e i relativi importi pianificati.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Un budget ben strutturato rende chiaro ogni confronto con i consuntivi.', placement: 'center' },
        ],
      },
      costs: {
        id: 'finance_card_help_costs',
        steps: [
          { target: null, title: 'Guida Consuntivi', content: 'Qui registri i costi reali che stanno maturando nel cantiere.', placement: 'center' },
          { target: '[data-tour="finance-costs-form"]', title: 'Form costi', content: 'Inserisci tipologia, data, descrizione, importo e società collegata.', placement: 'bottom' },
          { target: '[data-tour="finance-costs-list"]', title: 'Storico costi', content: 'Rivedi i costi registrati e verifica la distribuzione per categoria.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Aggiorna i consuntivi con frequenza: il forecast sarà più affidabile.', placement: 'center' },
        ],
      },
      rates: {
        id: 'finance_card_help_rates',
        steps: [
          { target: null, title: 'Guida Tariffe manodopera', content: 'Questa card collega persone, tariffe orarie e timbrature.', placement: 'center' },
          { target: '[data-tour="finance-rates-sync"]', title: 'Sync da timbrature', content: 'Mostra quante sessioni sono pronte e l’importo stimato da sincronizzare.', placement: 'bottom' },
          { target: '[data-tour="finance-rates-form"]', title: 'Form tariffe', content: 'Definisci tariffa per società o per singola persona, con validità temporale.', placement: 'bottom' },
          { target: '[data-tour="finance-rates-list"]', title: 'Tariffe attive', content: 'Consulta lo storico tariffe configurate e i periodi di validità.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Tariffe aggiornate significano consuntivi manodopera più precisi.', placement: 'center' },
        ],
      },
      progress: {
        id: 'finance_card_help_progress',
        steps: [
          { target: null, title: 'Guida Stati avanzamento (SAL)', content: 'Questa card gestisce i SAL e gli importi maturati/da pagare.', placement: 'center' },
          { target: '[data-tour="finance-progress-sequence-auto"]', title: 'Progressivo automatico', content: 'Il numero SAL è assegnato automaticamente dal sistema. Non va inserito manualmente.', placement: 'bottom' },
          { target: '[data-tour="finance-progress-form"]', title: 'Form SAL', content: 'Inserisci data, maturato, anticipi, da pagare e note del SAL.', placement: 'bottom' },
          { target: '[data-tour="finance-progress-list"]', title: 'Elenco SAL', content: 'Controlla stato, importi e approvazioni dei SAL già emessi.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Con i SAL aggiornati hai sempre una vista chiara del ciclo economico del cantiere.', placement: 'center' },
        ],
      },
    };

    return map[card] || map.settings;
  }

  const map = {
    kpi: {
      id: 'finance_card_help_kpi',
      steps: [
        { target: null, title: 'Finance KPI guide', content: 'Let us review the top financial indicators.', placement: 'center' },
        { target: '[data-tour="finance-kpi-row"]', title: 'Card purpose', content: 'These KPIs provide a quick health check of worksite economics.', placement: 'bottom' },
        { target: '[data-tour="finance-kpi-budget"]', title: 'Planned budget', content: 'Total planned estimate across all budget lines, your economic target.', placement: 'bottom' },
        { target: '[data-tour="finance-kpi-actual"]', title: 'Recorded actuals', content: 'Total already recorded costs, showing current spending.', placement: 'bottom' },
        { target: '[data-tour="finance-kpi-labor"]', title: 'Labor actuals', content: 'Labor amount derived from the active method: work sessions or manual entries.', placement: 'bottom' },
        { target: '[data-tour="finance-kpi-forecast"]', title: 'Final forecast', content: 'Projected final amount combining current costs and remaining planned value.', placement: 'bottom' },
        { target: '[data-tour="finance-sal-report"]', title: 'Progress report metric', content: 'Shows statement count, approved statements, and total payable amount.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'Use these numbers to detect deviations before editing budget or actuals.', placement: 'center' },
      ],
    },
    settings: {
      id: 'finance_card_help_settings',
      steps: [
        { target: null, title: 'Financial settings guide', content: 'This card defines how worksite finance is interpreted.', placement: 'center' },
        { target: '[data-tour="finance-settings-card"]', title: 'Overview', content: 'These settings directly change how finance data is shown and managed.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-budget-mode"]', title: 'Budget mode', content: 'Choose between simple mode and analytical cost-code mode.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-visibility"]', title: 'Visibility', content: 'Define whether finance data is whole-worksite or company-scoped.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-labor-method"]', title: 'Labor method', content: 'Use manual labor costing or derive it from work sessions.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-sal-toggle"]', title: 'Progress statements toggle', content: 'Enable or disable progress statement workflow.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-badges"]', title: 'Summary badges', content: 'Quickly verify active settings before saving.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'Correct settings make the whole finance section consistent.', placement: 'center' },
      ],
    },
    budget: {
      id: 'finance_card_help_budget',
      steps: [
        { target: null, title: 'Budget lines guide', content: 'This card manages your worksite estimate.', placement: 'center' },
        { target: '[data-tour="finance-budget-form"]', title: 'Line creation', content: 'Fill title, category, planned amount, and responsible company.', placement: 'bottom' },
        { target: '[data-tour="finance-budget-list"]', title: 'Budget list', content: 'Review all planned lines and values.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'A clean budget structure makes actual comparison much clearer.', placement: 'center' },
      ],
    },
    costs: {
      id: 'finance_card_help_costs',
      steps: [
        { target: null, title: 'Cost entries guide', content: 'This card records actual costs over time.', placement: 'center' },
        { target: '[data-tour="finance-costs-form"]', title: 'Cost form', content: 'Enter type, date, description, amount, and optional company.', placement: 'bottom' },
        { target: '[data-tour="finance-costs-list"]', title: 'Cost history', content: 'Review recorded costs and category distribution.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'Keep actual costs updated for a reliable forecast.', placement: 'center' },
      ],
    },
    rates: {
      id: 'finance_card_help_rates',
      steps: [
        { target: null, title: 'Labor rates guide', content: 'This card links people, hourly rates, and work sessions.', placement: 'center' },
        { target: '[data-tour="finance-rates-sync"]', title: 'Work-session sync', content: 'See ready sessions and estimated amount before syncing.', placement: 'bottom' },
        { target: '[data-tour="finance-rates-form"]', title: 'Rate form', content: 'Define rates by company or by person with validity dates.', placement: 'bottom' },
        { target: '[data-tour="finance-rates-list"]', title: 'Active rates', content: 'Review configured rates and validity windows.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'Accurate rates improve labor actual precision.', placement: 'center' },
      ],
    },
    progress: {
      id: 'finance_card_help_progress',
      steps: [
        { target: null, title: 'Progress statement guide', content: 'This card manages statement lifecycle and payable amounts.', placement: 'center' },
        { target: '[data-tour="finance-progress-sequence-auto"]', title: 'Automatic sequence', content: 'Statement number is assigned automatically by the system.', placement: 'bottom' },
        { target: '[data-tour="finance-progress-form"]', title: 'Statement form', content: 'Set date, matured, advances, payable amount, and notes.', placement: 'bottom' },
        { target: '[data-tour="finance-progress-list"]', title: 'Statement list', content: 'Check status, amounts, and approvals for issued statements.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'Updated statements keep financial control transparent.', placement: 'center' },
      ],
    },
  };

  return map[card] || map.settings;
};
