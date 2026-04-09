export const getProjectTour = (language = 'it') => {
  if (language === 'it') {
    return {
      id: 'projects',
      steps: [
        {
          target: null,
          title: 'Benvenuto nel tuo primo cantiere! 🏗️',
          content: 'Ti mostreremo le funzionalità essenziali per gestire il cantiere in modo efficace.',
          placement: 'center',
        },
        {
          target: 'h1',
          title: 'Nome del Cantiere',
          content: 'Questo è il tuo cantiere. Qui troverai tutte le informazioni e gli strumenti per gestirlo.',
          placement: 'bottom',
          padding: 12,
        },
        {
          target: '[role="tablist"]',
          title: 'Sezioni del Cantiere',
          content: 'Organizza il lavoro in sezioni: Cantiere (panoramica), Lavori (task e milestone) e Info & Team (partecipanti e documenti).',
          placement: 'bottom',
          padding: 8,
        },
        {
          target: null,
          title: 'Esplora le Sezioni 📋',
          content: 'Clicca su "Cantiere" per una panoramica, su "Lavori" per gestire task e milestone, e su "Info & Team" per i dettagli del team.',
          placement: 'center',
        },
        {
          target: null,
          title: 'Gestione Task ✅',
          content: 'Nella sezione Lavori puoi creare, assegnare e monitorare i task del cantiere. Ogni task ha un responsabile e una scadenza.',
          placement: 'center',
        },
        {
          target: null,
          title: 'Milestone e Fasi 📅',
          content: 'Organizza i lavori in fasi (SAL). Ogni milestone raggruppa task correlati e hai visibility sullo stato di completamento.',
          placement: 'center',
        },
        {
          target: null,
          title: 'Messaggistica del Team 💬',
          content: 'Comunica con il team tramite la chat. Ogni cantiere ha il suo canale generale più eventuali canali custom.',
          placement: 'center',
        },
        {
          target: null,
          title: 'Team e Partecipanti 👥',
          content: 'Nella sezione Info & Team puoi gestire i partecipanti, caricare documenti e tenere traccia di tutto.',
          placement: 'center',
        },
        {
          target: null,
          title: 'Pronto a Iniziare! 🚀',
          content: 'Invita i membri del team, crea i tuoi task e inizia a organizzare il cantiere. Buon lavoro!',
          placement: 'center',
        },
      ],
    };
  }

  return {
    id: 'projects',
    steps: [
      {
        target: null,
        title: 'Welcome to your first worksite! 🏗️',
        content: 'We will show you the essential features to manage your construction site effectively.',
        placement: 'center',
      },
      {
        target: 'h1',
        title: 'Worksite Name',
        content: 'This is your worksite. Here you will find all information and tools to manage it.',
        placement: 'bottom',
        padding: 12,
      },
      {
        target: '[role="tablist"]',
        title: 'Worksite Sections',
        content: 'Organize work in sections: Site (overview), Work (tasks and milestones), and Info & Team (participants and documents).',
        placement: 'bottom',
        padding: 8,
      },
      {
        target: null,
        title: 'Explore Sections 📋',
        content: 'Click "Site" for an overview, "Work" to manage tasks and milestones, and "Info & Team" for team details.',
        placement: 'center',
      },
      {
        target: null,
        title: 'Task Management ✅',
          content: 'In the Work section you can create, assign, and track worksite tasks. Each task has an owner and a due date.',
        placement: 'center',
      },
      {
        target: null,
        title: 'Milestones and Phases 📅',
        content: 'Organize work by phases. Each milestone groups related tasks and gives visibility on completion status.',
        placement: 'center',
      },
      {
        target: null,
        title: 'Team Messaging 💬',
          content: 'Communicate with your team through chat. Each worksite has a general channel and optional custom channels.',
        placement: 'center',
      },
      {
        target: null,
        title: 'Team and Participants 👥',
        content: 'In Info & Team you can manage participants, upload documents, and keep track of everything.',
        placement: 'center',
      },
      {
        target: null,
        title: 'Ready to Start! 🚀',
          content: 'Invite team members, create your tasks, and start organizing your worksite. Good work!',
        placement: 'center',
      },
    ],
  };
};
