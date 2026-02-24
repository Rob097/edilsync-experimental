export const getEssentialOnboardingTour = (
  language = 'it',
  {
    hasProjectsInContext = false,
    hasCompaniesInContext = false,
    isCompanyContext = false,
  } = {},
) => {
  const baseItSteps = [
    {
      target: null,
      title: 'Benvenuto nella modalità Essenziale 👷',
      content: 'Questa modalità è pensata per essere più semplice e veloce durante il lavoro operativo in cantiere.',
      placement: 'center',
    },
    {
      target: '[data-tour="essential-menu-toggle"]',
      title: 'Menu rapido',
      content: 'Da qui apri il menu principale con accesso immediato a Home, Progetti, Società, Calendario e Impostazioni.',
      placement: 'bottom',
      padding: 8,
    },
    {
      target: '[data-tour="essential-context-card"]',
      title: 'Contesto di lavoro',
      content: 'Puoi cambiare al volo tra contesto Privato e Società, così vedi sempre solo i dati giusti.',
      placement: 'bottom',
      padding: 8,
    },
  ];

  const baseEnSteps = [
    {
      target: null,
      title: 'Welcome to Essential mode 👷',
      content: 'This mode is designed to be simpler and faster for day-to-day on-site operations.',
      placement: 'center',
    },
    {
      target: '[data-tour="essential-menu-toggle"]',
      title: 'Quick menu',
      content: 'Use this to open the main menu with quick access to Home, Projects, Companies, Calendar, and Settings.',
      placement: 'bottom',
      padding: 8,
    },
    {
      target: '[data-tour="essential-context-card"]',
      title: 'Work context',
      content: 'You can quickly switch between Personal and Company context, so you always see the right data.',
      placement: 'bottom',
      padding: 8,
    },
  ];

  const noAssociationsInContext = !hasProjectsInContext && !hasCompaniesInContext;

  if (language === 'it') {
    if (noAssociationsInContext) {
      return {
        id: 'essential_onboarding',
        steps: [
          ...baseItSteps,
          {
            target: null,
            title: 'Progetti e Società',
            content: 'Anche se al momento non hai ancora progetti o società associati, qui troverai percorsi guidati per crearli o accettare inviti.',
            placement: 'center',
          },
          {
            target: null,
            title: 'Operazioni rapide',
            content: 'Quando hai almeno un progetto attivo, vedrai il pulsante azioni rapide per aprire subito messaggi, attività, documenti e richieste.',
            placement: 'center',
          },
          {
            target: null,
            title: 'Quando vuoi puoi tornare indietro',
            content: 'Dal menu puoi sempre tornare alla modalità Normale con l\'interfaccia completa.',
            placement: 'center',
          },
        ],
      };
    }

    const contextualSteps = [];

    if (hasProjectsInContext) {
      contextualSteps.push({
        route: '/essenziale/progetti',
        target: '[data-tour="essential-projects-primary-action"]',
        title: 'Progetti nel tuo contesto',
        content: 'Ti porto nella sezione Progetti: da questo pulsante puoi crearne uno nuovo oppure aprire rapidamente quelli già disponibili.',
        placement: 'bottom',
        padding: 8,
      });
      contextualSteps.push({
        route: '/essenziale/progetti',
        target: '[data-tour="essential-projects-list"]',
        title: 'Elenco progetti',
        content: 'Qui trovi i progetti del contesto attivo. Apri una scheda per vedere attività, richieste, messaggi e documenti.',
        placement: 'top',
        padding: 8,
      });
    }

    if (hasCompaniesInContext) {
      contextualSteps.push({
        route: '/essenziale/societa',
        target: isCompanyContext ? '[data-tour="essential-companies-open-current"]' : '[data-tour="essential-companies-primary-action"]',
        title: 'Società nel tuo contesto',
        content: isCompanyContext
          ? 'Essendo in contesto società, da qui apri direttamente la società corrente e gestisci membri e dettagli principali.'
          : 'Ti porto nella sezione Società: puoi aprire le società associate o crearne una nuova quando serve.',
        placement: 'bottom',
        padding: 8,
      });
      contextualSteps.push({
        route: '/essenziale/societa',
        target: '[data-tour="essential-companies-list"]',
        title: 'Elenco società',
        content: 'Questa lista mostra le società disponibili nel tuo contesto: aprine una per entrare nei dettagli operativi.',
        placement: 'top',
        padding: 8,
      });
    }

    return {
      id: 'essential_onboarding',
      steps: [
        ...baseItSteps,
        ...contextualSteps,
        {
          target: hasProjectsInContext ? '[data-tour="essential-quick-actions"]' : null,
          title: 'Operazioni rapide',
          content: 'Con almeno un progetto attivo puoi usare il pulsante azioni rapide per saltare subito a messaggi, attività, documenti e richieste.',
          placement: hasProjectsInContext ? 'left' : 'center',
          padding: hasProjectsInContext ? 10 : undefined,
        },
        {
          target: null,
          title: 'Quando vuoi puoi tornare indietro',
          content: 'Dal menu puoi sempre tornare alla modalità Normale con l\'interfaccia completa.',
          placement: 'center',
        },
      ],
    };
  }

  if (noAssociationsInContext) {
    return {
      id: 'essential_onboarding',
      steps: [
        ...baseEnSteps,
        {
          target: null,
          title: 'Projects and Companies',
          content: 'Even if you are not linked to any projects or companies yet, you will find guided paths to create them or accept invitations.',
          placement: 'center',
        },
        {
          target: null,
          title: 'Quick actions',
          content: 'When you have at least one active project, you will see a quick actions button for messages, tasks, documents, and requests.',
          placement: 'center',
        },
        {
          target: null,
          title: 'Switch back anytime',
          content: 'From the menu, you can always return to Normal mode and its full interface.',
          placement: 'center',
        },
      ],
    };
  }

  const contextualSteps = [];

  if (hasProjectsInContext) {
    contextualSteps.push({
      route: '/essenziale/progetti',
      target: '[data-tour="essential-projects-primary-action"]',
      title: 'Projects in your context',
      content: 'I will bring you to Projects: from this button you can create a new project or quickly open existing ones.',
      placement: 'bottom',
      padding: 8,
    });
    contextualSteps.push({
      route: '/essenziale/progetti',
      target: '[data-tour="essential-projects-list"]',
      title: 'Project list',
      content: 'Here you can find projects in the active context. Open one to manage tasks, requests, messages, and documents.',
      placement: 'top',
      padding: 8,
    });
  }

  if (hasCompaniesInContext) {
    contextualSteps.push({
      route: '/essenziale/societa',
      target: isCompanyContext ? '[data-tour="essential-companies-open-current"]' : '[data-tour="essential-companies-primary-action"]',
      title: 'Companies in your context',
      content: isCompanyContext
        ? 'Since you are in company context, this opens the current company directly so you can manage members and core details.'
        : 'I will bring you to Companies: from here you can open linked companies or create a new one when needed.',
      placement: 'bottom',
      padding: 8,
    });
    contextualSteps.push({
      route: '/essenziale/societa',
      target: '[data-tour="essential-companies-list"]',
      title: 'Company list',
      content: 'This list shows the companies available in your current context: open one to enter operational details.',
      placement: 'top',
      padding: 8,
    });
  }

  return {
    id: 'essential_onboarding',
    steps: [
      ...baseEnSteps,
      ...contextualSteps,
      {
        target: hasProjectsInContext ? '[data-tour="essential-quick-actions"]' : null,
        title: 'Quick actions',
        content: 'With at least one active project, use quick actions to jump directly to messages, tasks, documents, and requests.',
        placement: hasProjectsInContext ? 'left' : 'center',
        padding: hasProjectsInContext ? 10 : undefined,
      },
      {
        target: null,
        title: 'Switch back anytime',
        content: 'From the menu, you can always return to Normal mode and its full interface.',
        placement: 'center',
      },
    ],
  };
};