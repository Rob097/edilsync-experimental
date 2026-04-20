const enterCompanySection = (navigateToSection, tab, section) => () => {
  navigateToSection?.(tab, section);
};

export const getCompanyTour = (language = 'it', options = {}) => {
  const {
    navigateToSection,
    isAdmin = false,
  } = options;

  if (language === 'it') {
    return {
      id: 'companies',
      steps: [
        {
          target: null,
          title: 'Benvenuto nella tua società',
          content: 'Ti facciamo vedere dove gestire squadra, documenti, chat interna e piano della società.',
          placement: 'center',
        },
        {
          target: '[data-tour="company-header"]',
          title: 'Nome della Società',
          content: 'Questa è la scheda della tua società. Qui tieni insieme persone, dati aziendali e attività condivise.',
          placement: 'bottom',
          padding: 12,
        },
        {
          target: '[data-tour="company-tabs"]',
          title: 'Aree della società',
          content: 'Queste schede dividono il lavoro per area: riepilogo, operatività, info e fatturazione.',
          placement: 'bottom',
          padding: 8,
          onEnter: enterCompanySection(navigateToSection, 'panoramica'),
        },
        {
          target: '[data-tour="company-quick-actions"]',
          title: 'Azioni rapide',
          content: 'Questi pulsanti ti portano subito nelle aree usate di più, senza dover cambiare sezione a mano.',
          placement: 'top',
          padding: 8,
          onEnter: enterCompanySection(navigateToSection, 'panoramica'),
        },
        {
          target: '#section-timbrature',
          title: 'Timbrature e presenze',
          content: 'Qui vedi chi ha timbrato, chi è ancora attivo e le presenze registrate dalla società.',
          placement: 'top',
          padding: 8,
          onEnter: enterCompanySection(navigateToSection, 'operativita', 'timbrature'),
        },
        {
          target: '#section-chat-operativita',
          title: 'Chat interna',
          content: 'Qui la squadra si coordina sulle attività interne della società, non sul singolo cantiere.',
          placement: 'top',
          padding: 8,
          onEnter: enterCompanySection(navigateToSection, 'operativita', 'chat'),
        },
        {
          target: '#section-documenti',
          title: 'Documenti società',
          content: 'Qui tieni i documenti comuni della società, come moduli, certificati e file utili al team.',
          placement: 'top',
          padding: 8,
          onEnter: enterCompanySection(navigateToSection, 'info', 'documenti'),
        },
        {
          target: '[data-tour="company-members"]',
          title: 'Gestisci il team',
          content: 'Qui controlli chi fa parte della società, chi è stato invitato e con quale ruolo lavora.',
          placement: 'top',
          padding: 8,
          onEnter: enterCompanySection(navigateToSection, 'info', 'membri'),
        },
        isAdmin ? {
          target: '[data-tour="company-invite-button"]',
          title: 'Invita persone',
          content: 'Da qui inviti nuove persone nella società e assegni il ruolo giusto fin da subito.',
          placement: 'left',
          padding: 8,
          onEnter: enterCompanySection(navigateToSection, 'info', 'membri'),
        } : null,
        isAdmin ? {
          target: '[data-tour="company-billing-section"]',
          title: 'Fatturazione e piano',
          content: 'Qui controlli il piano della società e le funzioni disponibili. Se serve, da qui gestisci rinnovi e modifiche.',
          placement: 'top',
          padding: 8,
          onEnter: enterCompanySection(navigateToSection, 'billing'),
        } : null,
        {
          target: null,
          title: 'Società pronta',
          content: 'Ora puoi lavorare con il tuo team, creare cantieri a nome della società e gestire tutto da qui.',
          placement: 'center',
        },
      ].filter(Boolean),
    };
  }

  return {
    id: 'companies',
    steps: [
      {
        target: null,
        title: 'Welcome to your company',
        content: 'We will show you where to manage the team, documents, internal chat, and company plan.',
        placement: 'center',
      },
      {
        target: '[data-tour="company-header"]',
        title: 'Company Name',
        content: 'This is your company page. Keep people, company details, and shared activities together here.',
        placement: 'bottom',
        padding: 12,
      },
      {
        target: '[data-tour="company-tabs"]',
        title: 'Company areas',
        content: 'These tabs split the work into clear areas: overview, operations, info, and billing.',
        placement: 'bottom',
        padding: 8,
        onEnter: enterCompanySection(navigateToSection, 'panoramica'),
      },
      {
        target: '[data-tour="company-quick-actions"]',
        title: 'Quick actions',
        content: 'These buttons take you straight to the areas used most, without changing sections by hand.',
        placement: 'top',
        padding: 8,
        onEnter: enterCompanySection(navigateToSection, 'panoramica'),
      },
      {
        target: '#section-timbrature',
        title: 'Time tracking and attendance',
        content: 'See who clocked in, who is still active, and the attendance recorded for the company.',
        placement: 'top',
        padding: 8,
        onEnter: enterCompanySection(navigateToSection, 'operativita', 'timbrature'),
      },
      {
        target: '#section-chat-operativita',
        title: 'Internal chat',
        content: 'Use this chat to coordinate internal company work, not just a single worksite.',
        placement: 'top',
        padding: 8,
        onEnter: enterCompanySection(navigateToSection, 'operativita', 'chat'),
      },
      {
        target: '#section-documenti',
        title: 'Company documents',
        content: 'Keep shared company documents here, such as forms, certificates, and files useful to the team.',
        placement: 'top',
        padding: 8,
        onEnter: enterCompanySection(navigateToSection, 'info', 'documenti'),
      },
      {
        target: '[data-tour="company-members"]',
        title: 'Manage the team',
        content: 'Check who belongs to the company, who has been invited, and which role each person has.',
        placement: 'top',
        padding: 8,
        onEnter: enterCompanySection(navigateToSection, 'info', 'membri'),
      },
      isAdmin ? {
        target: '[data-tour="company-invite-button"]',
        title: 'Invite people',
        content: 'Invite new people into the company from here and assign the right role from the start.',
        placement: 'left',
        padding: 8,
        onEnter: enterCompanySection(navigateToSection, 'info', 'membri'),
      } : null,
      isAdmin ? {
        target: '[data-tour="company-billing-section"]',
        title: 'Billing and plan',
        content: 'Check the company plan and available features here. If needed, manage renewals and plan changes from this area.',
        placement: 'top',
        padding: 8,
        onEnter: enterCompanySection(navigateToSection, 'billing'),
      } : null,
      {
        target: null,
        title: 'Company ready',
        content: 'You can now work with your team, create company worksites, and manage everything from here.',
        placement: 'center',
      },
    ].filter(Boolean),
  };
};
