export const companyTour = {
  id: 'companies',
  steps: [
    {
      target: null,
      title: 'Benvenuto nella tua società! 🏢',
      content: 'Ti guideremo attraverso le funzionalità principali per gestire la tua società e il team.',
      placement: 'center',
    },
    {
      target: '[data-tour="company-info"]',
      title: 'Informazioni Società',
      content: 'Visualizza e modifica i dati della società: nome, P.IVA, indirizzo e contatti.',
      placement: 'bottom',
      padding: 8,
    },
    {
      target: '[data-tour="company-members"]',
      title: 'Membri del Team',
      content: 'Gestisci chi fa parte della società. Puoi invitare nuovi membri e assegnare ruoli (admin o membro).',
      placement: 'bottom',
      padding: 8,
    },
    {
      target: '[data-tour="invite-member"]',
      title: 'Invita Membri',
      content: 'Gli admin possono invitare nuovi professionisti. Specifica la professione e il ruolo all\'interno della società.',
      placement: 'left',
      padding: 8,
    },
    {
      target: '[data-tour="company-projects"]',
      title: 'Progetti della Società',
      content: 'Quando crei un progetto come società, tutti i membri possono accedervi e collaborare.',
      placement: 'top',
      padding: 8,
    },
    {
      target: null,
      title: 'Società Configurata! 🎯',
      content: 'Ora puoi invitare il tuo team e iniziare a creare progetti a nome della società. Buon lavoro!',
      placement: 'center',
    },
  ],
};