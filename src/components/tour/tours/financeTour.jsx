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
          content: 'Questa guida ti fa vedere dove leggere numeri, budget, costi, tariffe e SAL del cantiere.',
          placement: 'center',
        },
        {
          target: '#section-finance',
          title: 'Economia di commessa',
          content: 'Qui tieni sotto controllo la parte economica del cantiere senza uscire dal progetto.',
          placement: 'top',
        },
        {
          target: '[data-tour="finance-sal-report"]',
          title: 'Mini report SAL',
          content: 'Qui vedi subito quanti SAL ci sono, quanto è maturato, quanto è stato anticipato e quanto resta da pagare.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="finance-kpi-row"]',
          title: 'Numeri chiave',
          content: 'Questi numeri ti fanno capire subito budget, costi registrati, manodopera e stima finale.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="finance-budget-card"]',
          title: 'Budget per voci',
          content: 'Qui costruisci il budget del cantiere voce per voce, con importi e società responsabile.',
          placement: 'top',
        },
        {
          target: '[data-tour="finance-costs-card"]',
          title: 'Consuntivi',
          content: 'Qui registri i costi reali e li confronti con quanto avevi previsto.',
          placement: 'top',
        },
        {
          target: '[data-tour="finance-rates-card"]',
          title: 'Tariffe manodopera',
          content: 'Qui imposti i costi orari e, se vuoi, trasformi le timbrature in costi di manodopera.',
          placement: 'top',
        },
        {
          target: '[data-tour="finance-settings-card"]',
          title: 'Impostazioni economiche',
          content: 'Qui decidi come deve lavorare la sezione economica: visibilità, metodo manodopera, budget e SAL.',
          placement: 'bottom',
        },
        {
          target: '[data-tour="finance-progress-card"]',
          title: 'Stati Avanzamento (SAL)',
          content: 'Qui prepari e controlli i SAL, con maturato, anticipi e importi da pagare.',
          placement: 'top',
        },
        {
          target: null,
          title: 'Hai completato la panoramica',
          content: 'Se vuoi approfondire una card, usa il pulsante ? e ti spieghiamo ogni campo.',
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
        content: 'This guide shows you where to read the key numbers and where to work on budget, costs, rates, and progress statements.',
        placement: 'center',
      },
      {
        target: '#section-finance',
        title: 'Worksite finance',
        content: 'Keep the financial side of the worksite under control here without leaving the project.',
        placement: 'top',
      },
      {
        target: '[data-tour="finance-sal-report"]',
        title: 'Progress statement mini report',
        content: 'See at a glance how many statements there are, how much has matured, how much was advanced, and what is still payable.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="finance-kpi-row"]',
        title: 'Finance KPIs',
        content: 'These numbers give you a quick view of budget, recorded costs, labor, and final estimate.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="finance-budget-card"]',
        title: 'Budget lines',
        content: 'Build the worksite budget line by line, with amounts and responsible company.',
        placement: 'top',
      },
      {
        target: '[data-tour="finance-costs-card"]',
        title: 'Cost entries',
        content: 'Record real costs here and compare them with what you planned.',
        placement: 'top',
      },
      {
        target: '[data-tour="finance-rates-card"]',
        title: 'Labor rates',
        content: 'Set hourly labor costs here and, if needed, turn work sessions into labor costs.',
        placement: 'top',
      },
      {
        target: '[data-tour="finance-settings-card"]',
        title: 'Financial settings',
        content: 'Choose how the finance area works: visibility, labor method, budget mode, and progress statements.',
        placement: 'bottom',
      },
      {
        target: '[data-tour="finance-progress-card"]',
        title: 'Progress statements',
        content: 'Prepare and review progress statements here, with matured amounts, advances, and payable totals.',
        placement: 'top',
      },
      {
        target: null,
        title: 'Overview complete',
        content: 'If you want more detail on a card, use the ? button and we will explain each field.',
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
          { target: '[data-tour="finance-kpi-row"]', title: 'A cosa serve questa card', content: 'Questi numeri ti danno una lettura veloce di come sta andando il cantiere sul piano economico.', placement: 'bottom' },
          { target: '[data-tour="finance-kpi-budget"]', title: 'Budget pianificato', content: 'È il totale di quello che avevi previsto di spendere.', placement: 'bottom' },
          { target: '[data-tour="finance-kpi-actual"]', title: 'Costi registrati', content: 'È il totale dei costi già inseriti: ti fa capire quanto hai già speso.', placement: 'bottom' },
          { target: '[data-tour="finance-kpi-labor"]', title: 'Costo manodopera', content: 'Qui vedi il costo della manodopera calcolato con il metodo attivo.', placement: 'bottom' },
          { target: '[data-tour="finance-kpi-forecast"]', title: 'Stima finale', content: 'Questa è la stima di spesa finale, calcolata con quello che hai già registrato e quello che resta.', placement: 'bottom' },
          { target: '[data-tour="finance-sal-report"]', title: 'Riepilogo SAL', content: 'Qui controlli quanti SAL ci sono e quale importo complessivo resta da pagare.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Guarda questi numeri per capire subito se stai andando fuori budget o se c\'è qualcosa da controllare.', placement: 'center' },
        ],
      },
      settings: {
        id: 'finance_card_help_settings',
        steps: [
          { target: null, title: 'Guida Impostazioni economiche', content: 'Questa card decide come deve funzionare la parte economica del cantiere.', placement: 'center' },
          { target: '[data-tour="finance-settings-card"]', title: 'Panoramica', content: 'Le scelte fatte qui cambiano il modo in cui leggi e gestisci i dati economici.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-budget-mode"]', title: 'Modalità budget', content: 'Qui scegli se usare un budget semplice o più dettagliato.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-visibility"]', title: 'Visibilità', content: 'Qui decidi chi può vedere i dati economici del cantiere.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-labor-method"]', title: 'Metodo manodopera', content: 'Puoi gestire la manodopera con costi manuali oppure partendo dalle timbrature.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-sal-toggle"]', title: 'Gestione SAL', content: 'Qui attivi o disattivi i SAL del cantiere.', placement: 'bottom' },
          { target: '[data-tour="finance-settings-badges"]', title: 'Riepilogo impostazioni', content: 'Qui vedi in breve quali impostazioni sono attive prima di salvare.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Se imposti bene questa card all\'inizio, tutta la sezione economia sarà più chiara e coerente.', placement: 'center' },
        ],
      },
      budget: {
        id: 'finance_card_help_budget',
        steps: [
          { target: null, title: 'Guida Budget per voci', content: 'Questa card serve per costruire il budget del cantiere.', placement: 'center' },
          { target: '[data-tour="finance-budget-form"]', title: 'Inserisci una voce', content: 'Per ogni voce compili titolo, categoria, importo e società responsabile.', placement: 'bottom' },
          { target: '[data-tour="finance-budget-list"]', title: 'Elenco budget', content: 'Qui controlli tutte le voci già inserite e i relativi importi.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Più il budget è ordinato, più è facile confrontarlo con i costi reali.', placement: 'center' },
        ],
      },
      costs: {
        id: 'finance_card_help_costs',
        steps: [
          { target: null, title: 'Guida Consuntivi', content: 'Qui registri i costi reali che si stanno accumulando nel cantiere.', placement: 'center' },
          { target: '[data-tour="finance-costs-form"]', title: 'Inserisci un costo', content: 'Compili tipologia, data, descrizione, importo e, se serve, la società collegata.', placement: 'bottom' },
          { target: '[data-tour="finance-costs-list"]', title: 'Storico costi', content: 'Qui rivedi i costi già registrati e controlli dove si stanno concentrando.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Se aggiorni spesso i costi reali, la lettura economica del cantiere sarà più affidabile.', placement: 'center' },
        ],
      },
      rates: {
        id: 'finance_card_help_rates',
        steps: [
          { target: null, title: 'Guida Tariffe manodopera', content: 'Questa card collega persone, costi orari e timbrature.', placement: 'center' },
          { target: '[data-tour="finance-rates-sync"]', title: 'Importa dalle timbrature', content: 'Qui vedi quante sessioni sono pronte e quale costo stimato puoi importare.', placement: 'bottom' },
          { target: '[data-tour="finance-rates-form"]', title: 'Inserisci una tariffa', content: 'Puoi impostare una tariffa per società o per una singola persona, con periodo di validità.', placement: 'bottom' },
          { target: '[data-tour="finance-rates-list"]', title: 'Tariffe attive', content: 'Qui controlli le tariffe già impostate e da quando valgono.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Tariffe aggiornate ti aiutano ad avere costi di manodopera più precisi.', placement: 'center' },
        ],
      },
      progress: {
        id: 'finance_card_help_progress',
        steps: [
          { target: null, title: 'Guida Stati avanzamento (SAL)', content: 'Questa card serve per gestire i SAL e gli importi maturati o da pagare.', placement: 'center' },
          { target: '[data-tour="finance-progress-sequence-auto"]', title: 'Numero automatico', content: 'Il numero del SAL viene assegnato dal sistema. Non devi inserirlo a mano.', placement: 'bottom' },
          { target: '[data-tour="finance-progress-form"]', title: 'Compila il SAL', content: 'Qui inserisci data, maturato, anticipi, da pagare e note.', placement: 'bottom' },
          { target: '[data-tour="finance-progress-list"]', title: 'Elenco SAL', content: 'Qui controlli lo stato dei SAL già emessi, con importi e approvazioni.', placement: 'bottom' },
          { target: null, title: 'Conclusione', content: 'Con i SAL aggiornati hai sempre una visione più chiara dei pagamenti del cantiere.', placement: 'center' },
        ],
      },
    };

    return map[card] || map.settings;
  }

  const map = {
    kpi: {
      id: 'finance_card_help_kpi',
      steps: [
        { target: null, title: 'Finance KPI guide', content: 'Let us review the main numbers shown at the top.', placement: 'center' },
        { target: '[data-tour="finance-kpi-row"]', title: 'What this card is for', content: 'These numbers give you a quick read of the financial situation of the worksite.', placement: 'bottom' },
        { target: '[data-tour="finance-kpi-budget"]', title: 'Planned budget', content: 'This is the total amount you expected to spend.', placement: 'bottom' },
        { target: '[data-tour="finance-kpi-actual"]', title: 'Recorded costs', content: 'This is the total of the costs already entered, so you can see what has already been spent.', placement: 'bottom' },
        { target: '[data-tour="finance-kpi-labor"]', title: 'Labor cost', content: 'This shows labor cost based on the active calculation method.', placement: 'bottom' },
        { target: '[data-tour="finance-kpi-forecast"]', title: 'Final estimate', content: 'This is the expected final cost based on what is already recorded and what is still left.', placement: 'bottom' },
        { target: '[data-tour="finance-sal-report"]', title: 'Progress statement summary', content: 'Check how many statements there are and the total amount still to be paid.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'Use these numbers to see quickly if the worksite is going over budget or needs attention.', placement: 'center' },
      ],
    },
    settings: {
      id: 'finance_card_help_settings',
      steps: [
        { target: null, title: 'Financial settings guide', content: 'This card decides how the finance side of the worksite should work.', placement: 'center' },
        { target: '[data-tour="finance-settings-card"]', title: 'Overview', content: 'Choices made here change how financial data is read and managed.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-budget-mode"]', title: 'Budget mode', content: 'Choose whether the budget should stay simple or become more detailed.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-visibility"]', title: 'Visibility', content: 'Decide who can see the financial data for this worksite.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-labor-method"]', title: 'Labor method', content: 'You can manage labor with manual costs or derive it from work sessions.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-sal-toggle"]', title: 'Progress statement workflow', content: 'Turn progress statements on or off here.', placement: 'bottom' },
        { target: '[data-tour="finance-settings-badges"]', title: 'Settings summary', content: 'This area gives you a quick check of the active settings before saving.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'If you set this card correctly at the beginning, the whole finance section will stay clearer.', placement: 'center' },
      ],
    },
    budget: {
      id: 'finance_card_help_budget',
      steps: [
        { target: null, title: 'Budget lines guide', content: 'This card is used to build the worksite budget.', placement: 'center' },
        { target: '[data-tour="finance-budget-form"]', title: 'Add a line', content: 'Fill in title, category, amount, and responsible company for each line.', placement: 'bottom' },
        { target: '[data-tour="finance-budget-list"]', title: 'Budget list', content: 'Review all lines already entered and their amounts here.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'The cleaner the budget is, the easier it is to compare it with real costs.', placement: 'center' },
      ],
    },
    costs: {
      id: 'finance_card_help_costs',
      steps: [
        { target: null, title: 'Cost entries guide', content: 'This card is where you record the real costs building up on the worksite.', placement: 'center' },
        { target: '[data-tour="finance-costs-form"]', title: 'Add a cost', content: 'Fill in type, date, description, amount, and company if needed.', placement: 'bottom' },
        { target: '[data-tour="finance-costs-list"]', title: 'Cost history', content: 'Review the costs already entered and see where they are concentrating.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'If you keep real costs updated, the financial picture of the worksite stays more reliable.', placement: 'center' },
      ],
    },
    rates: {
      id: 'finance_card_help_rates',
      steps: [
        { target: null, title: 'Labor rates guide', content: 'This card connects people, hourly costs, and work sessions.', placement: 'center' },
        { target: '[data-tour="finance-rates-sync"]', title: 'Import from work sessions', content: 'See how many sessions are ready and the estimated cost you can import.', placement: 'bottom' },
        { target: '[data-tour="finance-rates-form"]', title: 'Add a rate', content: 'Set a rate for a company or a single person, with a valid date range.', placement: 'bottom' },
        { target: '[data-tour="finance-rates-list"]', title: 'Active rates', content: 'Check the rates already set and the period when each one applies.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'Updated rates help keep labor costs more accurate.', placement: 'center' },
      ],
    },
    progress: {
      id: 'finance_card_help_progress',
      steps: [
        { target: null, title: 'Progress statement guide', content: 'This card is used to manage progress statements and payable amounts.', placement: 'center' },
        { target: '[data-tour="finance-progress-sequence-auto"]', title: 'Automatic number', content: 'The system assigns the statement number automatically, so you do not enter it by hand.', placement: 'bottom' },
        { target: '[data-tour="finance-progress-form"]', title: 'Fill in the statement', content: 'Set date, matured amount, advances, payable amount, and notes here.', placement: 'bottom' },
        { target: '[data-tour="finance-progress-list"]', title: 'Statement list', content: 'Check the status of issued statements, with amounts and approvals.', placement: 'bottom' },
        { target: null, title: 'Conclusion', content: 'When statements are updated, it is easier to keep payments under control.', placement: 'center' },
      ],
    },
  };

  return map[card] || map.settings;
};
