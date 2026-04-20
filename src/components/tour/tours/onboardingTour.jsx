import { createPageUrl } from '@/utils';

const goTo = (path) => ({ navigate }) => {
  const currentPath = `${window.location.pathname}${window.location.search || ''}`;
  if (currentPath !== path) {
    navigate(path);
  }
};

export const getOnboardingTour = (language = 'it', options = {}) => {
  const {
    currentContext = 'personal',
    activeCompanyId = null,
    hasCompanyContext = false,
  } = options;

  const dashboardPath = createPageUrl('Dashboard');
  const projectsPath = createPageUrl('Projects');
  const calendarPath = createPageUrl('Calendar');
  const notificationsPath = createPageUrl('Notifications');
  const companyWorkspacePath = currentContext === 'company' && activeCompanyId
    ? `${createPageUrl('CompanyDetail')}?id=${activeCompanyId}`
    : createPageUrl('Companies');
  const companyTarget = currentContext === 'company' && activeCompanyId
    ? '[data-tour="company-header"]'
    : '[data-tour="companies-header"]';

  if (language === 'it') {
    return {
      id: 'onboarding',
      steps: [
        {
          target: null,
          title: 'Benvenuto in EdilSync',
          content: 'Ti facciamo vedere dove trovi cantieri, calendario, società e notifiche. Così sai subito dove andare quando inizi a lavorare.',
          placement: 'center',
          onEnter: goTo(dashboardPath),
        },
        {
          target: '[data-tour="dashboard-header"]',
          title: 'Dashboard operativa',
          content: 'Questa è la schermata iniziale. Ti mostra cosa seguire subito e ti porta velocemente nelle aree che usi di più.',
          placement: 'bottom',
          padding: 8,
          onEnter: goTo(dashboardPath),
        },
        {
          target: '[data-tour="projects-header"]',
          title: 'Cantieri',
          content: 'Qui trovi tutti i cantieri a cui lavori. Da qui apri un cantiere esistente o ne crei uno nuovo.',
          placement: 'bottom',
          padding: 8,
          onEnter: goTo(projectsPath),
        },
        {
          target: '[data-tour="projects-list"]',
          title: 'Portfolio cantieri',
          content: 'In questo elenco vedi i cantieri attivi, quelli fermi e quelli appena creati. Se non ce ne sono ancora, è da qui che parti.',
          placement: 'top',
          padding: 8,
          onEnter: goTo(projectsPath),
        },
        {
          target: '[data-tour="calendar-shell"]',
          title: 'Calendario',
          content: 'Qui tieni sotto controllo appuntamenti, sopralluoghi, scadenze e attività del cantiere in un solo colpo d\'occhio.',
          placement: 'bottom',
          padding: 8,
          onEnter: goTo(calendarPath),
        },
        {
          target: companyTarget,
          title: 'Società',
          content: currentContext === 'company' && activeCompanyId
            ? 'Se stai lavorando come società, questo è il tuo spazio aziendale: membri, documenti, chat interna e piano.'
            : 'Qui trovi le società in cui lavori o che gestisci. Da qui entri nello spazio della tua impresa.',
          placement: 'bottom',
          padding: 8,
          onEnter: goTo(companyWorkspacePath),
        },
        hasCompanyContext ? {
          target: '[data-tour="context-switcher"]',
          title: 'Cambio Contesto',
          content: 'Da qui passi dal profilo personale alla società, e viceversa. È utile quando lavori sia per conto tuo sia per l\'impresa.',
          placement: 'left',
          padding: 8,
        } : null,
        {
          target: '[data-tour="notifications-list"]',
          title: 'Notifiche operative',
          content: 'Qui arrivano inviti, aggiornamenti, messaggi e promemoria. Ogni notifica ti porta direttamente nel punto giusto.',
          placement: 'top',
          padding: 8,
          onEnter: goTo(notificationsPath),
        },
        {
          target: '[data-tour="messaging"]',
          title: 'Messaggistica',
          content: 'Qui apri velocemente le conversazioni. Le chat restano separate tra cantieri e società, così non fai confusione.',
          placement: 'left',
          padding: 8,
        },
        {
          target: '[data-tour="assistant"]',
          title: 'Assistente AI',
          content: 'Se hai un dubbio, l\'assistente ti aiuta a trovare funzioni, passaggi e informazioni senza perdere tempo.',
          placement: 'left',
          padding: 12,
        },
        {
          target: '[data-tour="user-menu-trigger"]',
          title: 'Modalità Operativa',
          content: 'Da qui apri le impostazioni rapide del profilo. La Modalità operativa semplifica l\'uso da telefono, utile quando sei in movimento o in cantiere.',
          placement: 'left',
          padding: 8,
        },
        {
          target: null,
          title: 'Tutto pronto',
          content: 'Adesso puoi iniziare davvero: apri un cantiere, entra nella tua società oppure continua a esplorare l\'app. Buon lavoro.',
          placement: 'center',
          onEnter: goTo(dashboardPath),
        },
      ].filter(Boolean),
    };
  }

  return {
    id: 'onboarding',
    steps: [
      {
        target: null,
        title: 'Welcome to EdilSync',
        content: 'We will show you where to find worksites, calendar, companies, and notifications so you can start working right away.',
        placement: 'center',
        onEnter: goTo(dashboardPath),
      },
      {
        target: '[data-tour="dashboard-header"]',
        title: 'Operational dashboard',
        content: 'This is the starting screen. It shows what needs attention and gets you quickly to the areas you use most.',
        placement: 'bottom',
        padding: 8,
        onEnter: goTo(dashboardPath),
      },
      {
        target: '[data-tour="projects-header"]',
        title: 'Worksites',
        content: 'Here you find all the worksites you are working on. Open an existing one or create a new one from here.',
        placement: 'bottom',
        padding: 8,
        onEnter: goTo(projectsPath),
      },
      {
        target: '[data-tour="projects-list"]',
        title: 'Worksite portfolio',
        content: 'This list shows active worksites, paused ones, and newly created ones. If you do not have any yet, this is where you begin.',
        placement: 'top',
        padding: 8,
        onEnter: goTo(projectsPath),
      },
      {
        target: '[data-tour="calendar-shell"]',
        title: 'Calendar',
        content: 'Keep inspections, deadlines, appointments, and worksite activities under control in one place.',
        placement: 'bottom',
        padding: 8,
        onEnter: goTo(calendarPath),
      },
      {
        target: companyTarget,
        title: 'Companies',
        content: currentContext === 'company' && activeCompanyId
          ? 'If you are working as a company, this is your company space: members, documents, internal chat, and plan.'
          : 'Here you find the companies you work with or manage. Open your company space from here.',
        placement: 'bottom',
        padding: 8,
        onEnter: goTo(companyWorkspacePath),
      },
      hasCompanyContext ? {
        target: '[data-tour="context-switcher"]',
        title: 'Context Switcher',
        content: 'Switch between personal work and company work from here. Each context keeps its own worksites, people, and data separate.',
        placement: 'left',
        padding: 8,
      } : null,
      {
        target: '[data-tour="notifications-list"]',
        title: 'Operational notifications',
        content: 'This is where invites, updates, messages, and reminders arrive. Each notification opens the right place directly.',
        placement: 'top',
        padding: 8,
        onEnter: goTo(notificationsPath),
      },
      {
        target: '[data-tour="messaging"]',
        title: 'Messaging',
        content: 'Open conversations quickly from here. Chats stay separate between worksites and companies so things stay clear.',
        placement: 'left',
        padding: 8,
      },
      {
        target: '[data-tour="assistant"]',
        title: 'AI Assistant',
        content: 'If you are unsure about something, the assistant helps you find the right function, step, or information faster.',
        placement: 'left',
        padding: 12,
      },
      {
        target: '[data-tour="user-menu-trigger"]',
        title: 'Operational Mode',
        content: 'Open this menu for quick profile actions. Operational Mode makes the app easier to use on a phone while you are on site.',
        placement: 'left',
        padding: 8,
      },
      {
        target: null,
        title: 'All set',
        content: 'You can start for real now: open a worksite, enter your company space, or keep exploring the app.',
        placement: 'center',
        onEnter: goTo(dashboardPath),
      },
    ].filter(Boolean),
  };
};