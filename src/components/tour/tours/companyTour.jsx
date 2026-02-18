export const getCompanyTour = (language = 'it') => {
  if (language === 'it') {
    return {
      id: 'companies',
      steps: [
        {
          target: null,
          title: 'Benvenuto nella tua società! 🏢',
          content: 'Ti guideremo attraverso le funzionalità principali per gestire la tua società e il team.',
          placement: 'center',
        },
        {
          target: 'h1',
          title: 'Nome della Società',
          content: 'Questa è la tua società. Qui potrai gestire i membri del team, i dati aziendali e i progetti associati.',
          placement: 'bottom',
          padding: 12,
        },
        {
          target: null,
          title: 'Informazioni Società 📋',
          content: 'Nella parte superiore puoi visualizzare e modificare i dati della società: indirizzo, telefono, email e descrizione.',
          placement: 'center',
        },
        {
          target: '[data-tour="company-members"]',
          title: 'Gestisci il Team 👥',
          content: 'Nella sezione Membri puoi vedere tutti i componenti del team, invitare nuovi professionisti e gestire i ruoli.',
          placement: 'top',
          padding: 8,
        },
        {
          target: null,
          title: 'Invita Professionisti 🤝',
          content: 'Usa il pulsante "Invita" per aggiungere contractor, architetti, ingegneri e altri professionisti alla società.',
          placement: 'center',
        },
        {
          target: null,
          title: 'Società Pronta! ✅',
          content: 'Ora puoi iniziare a collaborare con il tuo team. Crea progetti a nome della società e gestisci la collaborazione!',
          placement: 'center',
        },
      ],
    };
  }

  return {
    id: 'companies',
    steps: [
      {
        target: null,
        title: 'Welcome to your company! 🏢',
        content: 'We will guide you through the main features to manage your company and team.',
        placement: 'center',
      },
      {
        target: 'h1',
        title: 'Company Name',
        content: 'This is your company workspace. Here you can manage team members, company data, and related projects.',
        placement: 'bottom',
        padding: 12,
      },
      {
        target: null,
        title: 'Company Information 📋',
        content: 'At the top you can view and update company details: address, phone, email, and description.',
        placement: 'center',
      },
      {
        target: '[data-tour="company-members"]',
        title: 'Manage the Team 👥',
        content: 'In the Members section, you can see all team members, invite new professionals, and manage roles.',
        placement: 'top',
        padding: 8,
      },
      {
        target: null,
        title: 'Invite Professionals 🤝',
        content: 'Use the "Invite" button to add contractors, architects, engineers, and other professionals to the company.',
        placement: 'center',
      },
      {
        target: null,
        title: 'Company Ready! ✅',
        content: 'You can now collaborate with your team. Create projects under the company and manage collaboration!',
        placement: 'center',
      },
    ],
  };
};
