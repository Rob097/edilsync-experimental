export const getOnboardingTour = (language = 'it') => {
  if (language === 'it') {
    return {
      id: 'onboarding',
      steps: [
        {
          target: null,
          title: 'Benvenuto in EdilSync! 🎉',
          content: 'Ti guideremo attraverso le funzionalità principali dell\'app per aiutarti a iniziare subito. Questo tour richiederà solo 2 minuti.',
          placement: 'center',
        },
        {
          target: '[data-tour="nav-dashboard"]',
          title: 'Dashboard',
          content: 'Qui troverai una panoramica generale dei tuoi progetti, società e attività recenti. È il tuo punto di partenza.',
          placement: 'bottom',
          padding: 8,
        },
        {
          target: 'a[href*="Projects"]',
          title: 'Progetti',
          content: 'Gestisci tutti i tuoi cantieri: crea nuovi progetti, monitora lo stato dei lavori, assegna task e collabora con il team.',
          placement: 'bottom',
          padding: 8,
        },
        {
          target: 'a[href*="Calendar"]',
          title: 'Calendario',
          content: 'Pianifica appuntamenti, sopralluoghi e scadenze. Tutti gli eventi sono sincronizzati con i tuoi progetti.',
          placement: 'bottom',
          padding: 8,
        },
        {
          target: 'a[href*="Companies"]',
          title: 'Società',
          content: 'Gestisci le tue società, invita membri del team e organizza la collaborazione tra professionisti.',
          placement: 'bottom',
          padding: 8,
        },
        {
          target: '[data-tour="context-switcher"]',
          title: 'Cambio Contesto',
          content: 'Passa rapidamente tra lavoro personale e società. Ogni contesto ha i suoi progetti, membri e dati separati.',
          placement: 'left',
          padding: 8,
        },
        {
          target: '[data-tour="notifications"]',
          title: 'Notifiche',
          content: 'Ricevi aggiornamenti in tempo reale su inviti, task assegnati, cambiamenti di stato e messaggi.',
          placement: 'left',
          padding: 8,
        },
        {
          target: '[data-tour="messaging"]',
          title: 'Messaggistica',
          content: 'Comunica con il team tramite canali dedicati per ogni progetto o società. Ricevi notifiche sui nuovi messaggi.',
          placement: 'left',
          padding: 8,
        },
        {
          target: '[data-tour="assistant"]',
          title: 'Assistente AI',
          content: 'Il tuo assistente personale è sempre disponibile per aiutarti con qualsiasi domanda o operazione nell\'app.',
          placement: 'left',
          padding: 12,
        },
        {
          target: null,
          title: 'Tutto Pronto! 🚀',
          content: 'Ora sei pronto per iniziare. Crea il tuo primo progetto o società, oppure esplora liberamente l\'app. Buon lavoro!',
          placement: 'center',
        },
      ],
    };
  }

  return {
    id: 'onboarding',
    steps: [
      {
        target: null,
        title: 'Welcome to EdilSync! 🎉',
        content: 'We will guide you through the main app features so you can get started right away. This tour only takes about 2 minutes.',
        placement: 'center',
      },
      {
        target: '[data-tour="nav-dashboard"]',
        title: 'Dashboard',
        content: 'Here you get a complete overview of your projects, companies, and recent activity. It is your starting point.',
        placement: 'bottom',
        padding: 8,
      },
      {
        target: 'a[href*="Projects"]',
        title: 'Projects',
        content: 'Manage all your construction projects: create new ones, monitor progress, assign tasks, and collaborate with your team.',
        placement: 'bottom',
        padding: 8,
      },
      {
        target: 'a[href*="Calendar"]',
        title: 'Calendar',
        content: 'Plan appointments, inspections, and deadlines. All events are synchronized with your projects.',
        placement: 'bottom',
        padding: 8,
      },
      {
        target: 'a[href*="Companies"]',
        title: 'Companies',
        content: 'Manage your companies, invite team members, and organize collaboration across professionals.',
        placement: 'bottom',
        padding: 8,
      },
      {
        target: '[data-tour="context-switcher"]',
        title: 'Context Switcher',
        content: 'Quickly switch between personal and company work. Each context has separate projects, members, and data.',
        placement: 'left',
        padding: 8,
      },
      {
        target: '[data-tour="notifications"]',
        title: 'Notifications',
        content: 'Receive real-time updates for invitations, assigned tasks, status changes, and messages.',
        placement: 'left',
        padding: 8,
      },
      {
        target: '[data-tour="messaging"]',
        title: 'Messaging',
        content: 'Communicate with your team through dedicated channels for each project or company. Get notified on new messages.',
        placement: 'left',
        padding: 8,
      },
      {
        target: '[data-tour="assistant"]',
        title: 'AI Assistant',
        content: 'Your personal assistant is always available to help you with any question or operation in the app.',
        placement: 'left',
        padding: 12,
      },
      {
        target: null,
        title: 'All Set! 🚀',
        content: 'You are ready to begin. Create your first project or company, or simply explore the app. Enjoy your work!',
        placement: 'center',
      },
    ],
  };
};